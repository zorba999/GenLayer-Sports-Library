import { Button } from "@/components/ui/button";

const Nav = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="container-grid flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 border border-primary/30">
            <span className="absolute inset-0 rounded-sm bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.6),transparent_60%)]" />
            <span className="relative font-mono text-primary text-sm font-bold">G</span>
          </span>
          <span className="font-mono text-sm tracking-tight">
            genlayer<span className="text-muted-foreground">/</span>sports
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#sports" className="hover:text-foreground transition-colors">Sports</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#api" className="hover:text-foreground transition-colors">API</a>
          <a href="#install" className="hover:text-foreground transition-colors">Install</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/zorba999/GenLayer-Sports-Library"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="ghostBorder" size="sm">
              GitHub
            </Button>
          </a>
          <Button variant="hero" size="sm">Deploy</Button>
        </div>
      </div>
    </header>
  );
};

export default Nav;
