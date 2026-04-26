import { useWallet } from "@/context/WalletContext";

const Nav = () => {
  const { wallet, connecting, connectWallet, disconnectWallet } = useWallet();
  const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="container-grid flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 border border-primary/30">
            <span className="absolute inset-0 rounded-sm bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.6),transparent_60%)]" />
            <span className="relative font-mono text-primary text-sm font-bold">G</span>
          </span>
          <span className="font-mono text-sm tracking-tight">
            genlayer<span className="text-muted-foreground">/</span>sports
          </span>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#sports" className="hover:text-foreground transition-colors">Sports</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#api" className="hover:text-foreground transition-colors">API</a>
        </nav>

        {/* Wallet button */}
        {wallet ? (
          <button
            onClick={disconnectWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-primary/10 text-primary font-mono text-xs hover:bg-primary/20 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {short(wallet.address)}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-sm border border-border bg-surface text-muted-foreground font-mono text-xs hover:border-primary/50 hover:text-primary disabled:opacity-50 transition-colors"
          >
            {connecting ? "Connecting…" : "🔗 Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Nav;
