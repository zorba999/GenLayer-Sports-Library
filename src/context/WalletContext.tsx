import { createContext, useContext, useState, ReactNode } from "react";
import { ethers } from "ethers";

const BRADBURY_CHAIN = {
  chainId: "0x107D",
  chainName: "Genlayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc-bradbury.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
};

type WalletState = { signer: ethers.Signer; address: string } | null;

interface WalletCtx {
  wallet: WalletState;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(null);
  const [connecting, setConnecting] = useState(false);

  async function connectWallet() {
    const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
    if (!eth) { alert("MetaMask not found. Please install MetaMask."); return; }
    setConnecting(true);
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

      eth.on?.("accountsChanged", (accs: string[]) => {
        if (!accs.length) setWallet(null);
      });
      eth.on?.("chainChanged", () => setWallet(null));
    } catch (e: unknown) {
      if ((e as { code?: number }).code !== 4001) console.error(e);
    } finally {
      setConnecting(false);
    }
  }

  function disconnectWallet() { setWallet(null); }

  return (
    <WalletContext.Provider value={{ wallet, connecting, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
