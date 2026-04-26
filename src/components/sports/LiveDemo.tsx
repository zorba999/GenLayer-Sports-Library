import { useState, useRef } from "react";
import { ethers } from "ethers";

// ── Constants ────────────────────────────────────────────────────────────────
const RPC = "https://rpc-bradbury.genlayer.com";
const CONTRACT = "0x5d5d5b3a451a6dfbf8bc4f63578711e71b438855";
const CONSENSUS = "0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D";
const CHAIN_ID = 4221;
const EXPLORER = "https://zksync-os-testnet-genlayer.explorer.zksync.dev/tx/";

const BRADBURY_CHAIN = {
  chainId: "0x107D",
  chainName: "Genlayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc-bradbury.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
};

const ADD_TX_ABI = [
  "function addTransaction(address _sender, address _recipient, uint256 _numOfInitialValidators, uint256 _maxRotations, bytes _txData, uint256 _validUntil)",
];

// ── GL Calldata encoder ──────────────────────────────────────────────────────
const T_STR = 4, T_ARR = 5, T_MAP = 6;
function writeULEB(to: number[], n: bigint) {
  if (n === 0n) { to.push(0); return; }
  while (n > 0n) { let b = Number(n & 0x7fn); n >>= 7n; if (n > 0n) b |= 0x80; to.push(b); }
}
function writeTyped(to: number[], n: bigint, t: number) { writeULEB(to, (n << 3n) | BigInt(t)); }
function encodeVal(to: number[], data: unknown) {
  if (data === null || data === undefined) { to.push(0); return; }
  if (typeof data === "string") {
    const b = new TextEncoder().encode(data);
    writeTyped(to, BigInt(b.length), T_STR);
    b.forEach(c => to.push(c));
    return;
  }
  if (typeof data === "number") { writeTyped(to, BigInt(data), 1); return; }
  if (Array.isArray(data)) {
    writeTyped(to, BigInt(data.length), T_ARR);
    data.forEach(x => encodeVal(to, x));
    return;
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).sort(([a], [b]) => a < b ? -1 : 1);
    writeTyped(to, BigInt(entries.length), T_MAP);
    for (const [k, v] of entries) {
      const kb = new TextEncoder().encode(k);
      writeULEB(to, BigInt(kb.length));
      kb.forEach(c => to.push(c));
      encodeVal(to, v);
    }
  }
}
function rlpBytes(b: number[]): number[] {
  const arr = b;
  if (arr.length === 1 && arr[0] < 0x80) return arr;
  if (arr.length < 56) return [0x80 + arr.length, ...arr];
  const lb: number[] = []; let l = arr.length;
  while (l > 0) { lb.unshift(l & 0xff); l >>= 8; }
  return [0xb7 + lb.length, ...lb, ...arr];
}
function rlpList(items: number[][]): number[] {
  const payload = items.flatMap(x => rlpBytes(x));
  if (payload.length < 56) return [0xc0 + payload.length, ...payload];
  const lb: number[] = []; let l = payload.length;
  while (l > 0) { lb.unshift(l & 0xff); l >>= 8; }
  return [0xf7 + lb.length, ...lb, ...payload];
}
function glSerialize(obj: unknown): string {
  const inner: number[] = []; encodeVal(inner, obj);
  const rlp = rlpList([inner, [0x00]]);
  return "0x" + rlp.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Sport = "football" | "basketball" | "f1" | "tennis";
type Result = { winner?: number | string; score?: string; sets?: string; team?: string; status: string };
type TxStatus = "idle" | "signing" | "submitted" | "error";

// ── Main component ────────────────────────────────────────────────────────────
const LiveDemo = () => {
  const [activeSport, setActiveSport] = useState<Sport>("football");
  const [wallet, setWallet] = useState<{ signer: ethers.Signer; address: string } | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fb, setFb] = useState({ team1: "Liverpool", team2: "Tottenham", date: "2025-04-27" });
  const [bb, setBb] = useState({ team1: "Lakers", team2: "Timberwolves", date: "2025-04-27" });
  const [f1, setF1] = useState({ race: "Monaco Grand Prix", year: "2025" });
  const [tn, setTn] = useState({ player1: "Carlos Alcaraz", player2: "Novak Djokovic", tournament: "Roland Garros 2025" });

  // ── Wallet ──────────────────────────────────────────────────────────────────
  async function connectWallet() {
    const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
    if (!eth) { alert("MetaMask not found. Please install MetaMask."); return; }
    try {
      await eth.request({ method: "eth_requestAccounts" });
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BRADBURY_CHAIN.chainId }] });
      } catch (e: unknown) {
        if ((e as { code?: number }).code === 4902) {
          await eth.request({ method: "wallet_addEthereumChain", params: [BRADBURY_CHAIN] });
        } else throw e;
      }
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet({ signer, address });
    } catch (e: unknown) {
      if ((e as { code?: number }).code !== 4001) console.error(e);
    }
  }

  // ── Submit TX ────────────────────────────────────────────────────────────────
  async function submitTx(method: string, args: unknown[]) {
    if (!wallet) throw new Error("Not connected");
    const calldataObj: Record<string, unknown> = { method };
    if (args.length > 0) calldataObj.args = args;
    const iface = new ethers.Interface(ADD_TX_ABI);
    const data = iface.encodeFunctionData("addTransaction", [
      wallet.address, CONTRACT, 5n, 3n, glSerialize(calldataObj), 0n,
    ]);
    const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
    const gasPrice = (await provider.getFeeData()).gasPrice ?? ethers.parseUnits("1", "gwei");
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    const tx = await wallet.signer.sendTransaction({
      to: CONSENSUS, data, gasLimit: 1_200_000n, gasPrice, nonce, chainId: CHAIN_ID, type: 0,
    });
    return tx.hash;
  }

  // ── Local API ────────────────────────────────────────────────────────────────
  async function fetchResult(endpoint: string, params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`/api/${endpoint}?${qs}`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json() as Promise<Result>;
  }

  // ── Run ──────────────────────────────────────────────────────────────────────
  async function run(method: string, args: unknown[], endpoint: string, params: Record<string, string>) {
    setResult(null); setTxHash(null); setTxError(null); setLoading(true);

    // Connect wallet if needed
    let w = wallet;
    if (!w) {
      await connectWallet();
      // wallet state updates async; grab signer fresh
      const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
      if (!eth) { setLoading(false); return; }
      try {
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        w = { signer, address };
        setWallet(w);
      } catch { setLoading(false); return; }
    }

    // Submit TX
    setTxStatus("signing");
    try {
      const hash = await submitTx(method, args);
      setTxHash(hash);
      setTxStatus("submitted");
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string };
      if (err.code === 4001 || err.message?.includes("rejected")) {
        setTxStatus("idle"); setLoading(false); return;
      }
      setTxError(err.message?.slice(0, 80) ?? "TX error");
      setTxStatus("error");
    }

    // Fetch result instantly
    try {
      const res = await fetchResult(endpoint, params);
      setResult(res);
    } catch (e: unknown) {
      setTxError((e as Error).message);
    }
    setLoading(false);
  }

  function handleFetch() {
    if (activeSport === "football") {
      run("check_football", [fb.team1, fb.team2, fb.date], "football", { team1: fb.team1, team2: fb.team2, date: fb.date });
    } else if (activeSport === "basketball") {
      run("check_basketball", [bb.team1, bb.team2, bb.date], "basketball", { team1: bb.team1, team2: bb.team2, date: bb.date });
    } else if (activeSport === "f1") {
      run("check_f1", [f1.race, parseInt(f1.year)], "f1", { race: f1.race, year: f1.year });
    } else {
      run("check_tennis", [tn.player1, tn.player2, tn.tournament], "tennis", { player1: tn.player1, player2: tn.player2, tournament: tn.tournament });
    }
  }

  const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <section id="demo" className="border-y border-border/60 bg-surface/40">
      <div className="container-grid py-24 md:py-32">

        {/* Header */}
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <p className="label-mono mb-4">005 / Live Demo</p>
            <h2 className="display-serif text-5xl md:text-6xl leading-[0.95] tracking-tight">
              Try it now.<br />
              <span className="text-primary">On Bradbury.</span>
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 self-end">
            <p className="text-muted-foreground text-pretty leading-relaxed text-lg">
              Connect MetaMask, pick a fixture, click Fetch. A real transaction lands on
              Bradbury Testnet — the result appears instantly via the oracle layer.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-primary/20 via-transparent to-pitch/20 blur-lg opacity-50 rounded-sm" />
          <div className="relative bg-surface-elevated border border-border rounded-sm overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/40">
              <div className="flex gap-1">
                {(["football","basketball","f1","tennis"] as Sport[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setActiveSport(s); setResult(null); setTxHash(null); setTxError(null); }}
                    className={`px-3 py-1.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors ${
                      activeSport === s
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "football" ? "⚽" : s === "basketball" ? "🏀" : s === "f1" ? "🏎" : "🎾"} {s}
                  </button>
                ))}
              </div>

              {/* Wallet button */}
              {wallet ? (
                <button
                  onClick={() => setWallet(null)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-primary/10 text-primary font-mono text-xs hover:bg-primary/20 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {short(wallet.address)}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border text-muted-foreground font-mono text-xs hover:border-primary/40 hover:text-primary transition-colors"
                >
                  🔗 Connect Wallet
                </button>
              )}
            </div>

            {/* Body */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

              {/* Inputs */}
              <div className="p-6 space-y-4">
                {activeSport === "football" && (
                  <>
                    <Field label="Team 1" value={fb.team1} onChange={v => setFb(p => ({...p, team1: v}))} />
                    <Field label="Team 2" value={fb.team2} onChange={v => setFb(p => ({...p, team2: v}))} />
                    <Field label="Date (YYYY-MM-DD)" value={fb.date} onChange={v => setFb(p => ({...p, date: v}))} />
                  </>
                )}
                {activeSport === "basketball" && (
                  <>
                    <Field label="Team 1" value={bb.team1} onChange={v => setBb(p => ({...p, team1: v}))} />
                    <Field label="Team 2" value={bb.team2} onChange={v => setBb(p => ({...p, team2: v}))} />
                    <Field label="Date (YYYY-MM-DD)" value={bb.date} onChange={v => setBb(p => ({...p, date: v}))} />
                  </>
                )}
                {activeSport === "f1" && (
                  <>
                    <Field label="Race Name" value={f1.race} onChange={v => setF1(p => ({...p, race: v}))} />
                    <Field label="Year" value={f1.year} onChange={v => setF1(p => ({...p, year: v}))} />
                  </>
                )}
                {activeSport === "tennis" && (
                  <>
                    <Field label="Player 1" value={tn.player1} onChange={v => setTn(p => ({...p, player1: v}))} />
                    <Field label="Player 2" value={tn.player2} onChange={v => setTn(p => ({...p, player2: v}))} />
                    <Field label="Tournament" value={tn.tournament} onChange={v => setTn(p => ({...p, tournament: v}))} />
                  </>
                )}

                <button
                  onClick={handleFetch}
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-primary text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? txStatus === "signing" ? "⏳ Sign in MetaMask…" : "⚡ Fetching result…"
                    : "Fetch Result →"}
                </button>

                {/* TX status */}
                {txStatus === "submitted" && txHash && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                    <span className="text-primary text-xs">✅</span>
                    <div className="font-mono text-xs text-muted-foreground">
                      TX on Bradbury ·{" "}
                      <a
                        href={`${EXPLORER}${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {txHash.slice(0, 14)}…
                      </a>
                    </div>
                  </div>
                )}
                {txStatus === "error" && txError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm font-mono text-xs text-destructive/80">
                    ⚠ {txError}
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="p-6 flex flex-col justify-center min-h-[260px]">
                {result ? (
                  <ResultDisplay result={result} sport={activeSport} />
                ) : (
                  <div className="text-center text-muted-foreground font-mono text-xs">
                    {loading
                      ? <span className="animate-pulse">Querying oracle layer…</span>
                      : <>Fill the fields and click <span className="text-primary">Fetch Result →</span></>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Footer note */}
            <div className="px-6 py-3 border-t border-border bg-background/20 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Bradbury Testnet · Chain ID 4221 · Results via ESPN / Jolpica oracle
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="label-mono mb-1.5 block">{label}</label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-background border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
    />
  </div>
);

const ResultDisplay = ({ result, sport }: { result: Result; sport: Sport }) => {
  const { winner, score, sets, team, status } = result;
  const scoreDisplay = score || sets || (sport === "f1" ? "P1" : "-");
  const isFinished = status === "finished";

  if (sport === "f1") {
    return (
      <div className="space-y-4">
        <div className="label-mono">Race Winner</div>
        {isFinished ? (
          <>
            <div className="font-display text-4xl font-medium text-primary glow-text">{winner as string}</div>
            <div className="font-mono text-sm text-muted-foreground">{team}</div>
          </>
        ) : (
          <div className="font-mono text-sm text-muted-foreground">{status}</div>
        )}
        <StatusChip status={status} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="label-mono">Match Result</div>
      <div className="display-serif text-6xl text-primary glow-text leading-none">{scoreDisplay}</div>
      {isFinished && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-display font-medium ${
          winner === 1 || winner === 2 ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
        }`}>
          🏆{" "}
          {winner === 0 ? "Draw" : winner === 1 ? "Team 1 wins" : winner === 2 ? "Team 2 wins" : "—"}
        </div>
      )}
      <StatusChip status={status} />
    </div>
  );
};

const StatusChip = ({ status }: { status: string }) => (
  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider border border-border rounded-sm inline-flex px-2 py-1">
    {status === "finished" ? "✓ finished" : status === "ongoing" ? "🔴 live" : status === "upcoming" ? "⏳ upcoming" : "❓ " + status}
  </div>
);

export default LiveDemo;
