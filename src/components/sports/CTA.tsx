import { Button } from "@/components/ui/button";

const CTA = () => (
  <section id="install" className="container-grid py-28 md:py-40">
    <div className="relative overflow-hidden border border-border rounded-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.18),transparent_50%),radial-gradient(circle_at_80%_70%,hsl(var(--pitch)/0.25),transparent_55%)]" />
      <div className="absolute inset-0 grid-lines opacity-[0.15]" />

      <div className="relative px-8 md:px-16 py-20 md:py-28 text-center max-w-3xl mx-auto">
        <p className="label-mono mb-6">005 / Kick off</p>
        <h2 className="display-serif text-5xl md:text-7xl tracking-tighter leading-[0.95] text-balance">
          Ship a sports market
          <br />
          <span className="text-primary glow-text">before the final whistle.</span>
        </h2>
        <p className="mt-8 text-lg text-muted-foreground text-pretty">
          Clone the repo, deploy to Bradbury testnet, and start composing
          intelligent contracts that listen to the real world.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/zorba999/GenLayer-Sports-Library"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="hero" size="xl">Clone on GitHub →</Button>
          </a>
          <Button variant="ghostBorder" size="xl">View example contract</Button>
        </div>
      </div>
    </div>
  </section>
);

export default CTA;
