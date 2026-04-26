import { Button } from "@/components/ui/button";
import heroPitch from "@/assets/hero-pitch.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Pitch background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroPitch}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 grid-lines opacity-[0.18]" />
      </div>

      <div className="container-grid pt-20 pb-24 md:pt-28 md:pb-36">
        {/* Top meta row */}
        <div className="flex flex-wrap items-center gap-6 mb-14 float-in">
          <div className="flex items-center gap-2">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="label-mono text-foreground/80">Bradbury Testnet · Live</span>
          </div>
          <div className="hidden sm:block h-3 w-px bg-border" />
          <span className="label-mono">v0.1 · Python 3.11</span>
          <div className="hidden sm:block h-3 w-px bg-border" />
          <span className="label-mono">Open Source · MIT</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 float-in" style={{ animationDelay: "0.1s" }}>
            <p className="label-mono mb-6">
              001 / Real-world sports oracle for GenLayer
            </p>
            <h1 className="text-balance leading-[0.95] tracking-tighter text-[clamp(2.6rem,7.5vw,6.5rem)] font-light">
              <span className="display-serif italic text-muted-foreground">The </span>
              <span className="font-display font-medium">match result,</span>{" "}
              <br className="hidden md:block" />
              <span className="text-primary glow-text">on-chain</span>
              <span className="display-serif italic text-muted-foreground">.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed">
              A Python library for GenLayer Intelligent Contracts that fetches
              real-world results for football, basketball, F1 and tennis —
              ready to power on-chain bets, prediction markets and fan tokens.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button variant="hero" size="xl">Deploy your contract →</Button>
              <Button variant="ghostBorder" size="xl">Read the docs</Button>
            </div>
          </div>

          {/* Scoreboard card */}
          <div
            className="lg:col-span-4 float-in"
            style={{ animationDelay: "0.25s" }}
          >
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-primary/30 via-transparent to-pitch/30 blur-lg opacity-60" />
              <div className="relative bg-surface-elevated/80 backdrop-blur-xl border border-border rounded-sm p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between mb-6">
                  <span className="label-mono">Live result</span>
                  <span className="label-mono text-primary">FT</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="label-mono text-foreground/60 mb-2">Home</div>
                    <div className="font-display text-2xl tracking-tight">Arsenal</div>
                  </div>
                  <div className="display-serif text-5xl text-primary glow-text leading-none px-2">
                    2<span className="text-muted-foreground/50 mx-2">:</span>1
                  </div>
                  <div className="flex-1 text-right">
                    <div className="label-mono text-foreground/60 mb-2">Away</div>
                    <div className="font-display text-2xl tracking-tight">Chelsea</div>
                  </div>
                </div>

                <div className="hairline my-6" />

                <dl className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>winner</dt>
                    <dd className="text-primary">1</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>status</dt>
                    <dd className="text-foreground">"finished"</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>tx</dt>
                    <dd className="text-foreground/80 truncate max-w-[160px]">0x9a4e…fb21</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="border-y border-border/60 bg-surface/60 overflow-hidden">
        <div className="ticker flex gap-12 py-4 whitespace-nowrap font-mono text-sm text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0">
              <Tick label="ARS 2 : 1 CHE" tag="EPL" />
              <Tick label="LAL 112 : 108 BOS" tag="NBA" />
              <Tick label="VERSTAPPEN · WIN" tag="F1 / MIA" />
              <Tick label="ALCARAZ 3 : 1 SINNER" tag="ATP" />
              <Tick label="MAD 3 : 0 BAR" tag="LALIGA" />
              <Tick label="HAMILTON · P3" tag="F1 / SPA" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Tick = ({ label, tag }: { label: string; tag: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-primary text-[10px]">●</span>
    <span className="label-mono">{tag}</span>
    <span className="text-foreground">{label}</span>
  </div>
);

export default Hero;
