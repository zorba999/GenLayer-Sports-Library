const Footer = () => (
  <footer className="border-t border-border/60 bg-surface/40">
    <div className="container-grid py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="font-mono text-xs text-muted-foreground">
        © {new Date().getFullYear()} GenLayer Sports Library — released under MIT.
      </div>
      <nav className="flex flex-wrap gap-6 text-xs font-mono text-muted-foreground">
        <a className="hover:text-foreground transition-colors" href="#sports">Sports</a>
        <a className="hover:text-foreground transition-colors" href="#how">Mechanism</a>
        <a className="hover:text-foreground transition-colors" href="#api">API</a>
        <a className="hover:text-foreground transition-colors" href="https://github.com/zorba999/GenLayer-Sports-Library" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>
    </div>
  </footer>
);

export default Footer;
