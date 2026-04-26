const stats = [
  { k: "4", label: "Sports supported", sub: "Football, Basketball, F1, Tennis" },
  { k: "1", label: "Function call", sub: "SportsLib.get_*_result()" },
  { k: "0", label: "Centralized oracles", sub: "Validator-driven consensus" },
  { k: "∞", label: "Markets unlocked", sub: "Bets · Fan tokens · Prediction" },
];

const Stats = () => (
  <section className="border-y border-border/60 bg-background relative overflow-hidden">
    <div className="absolute inset-0 pitch-stripe opacity-[0.25]" />
    <div className="container-grid py-20 md:py-24 relative">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-8 min-h-[180px] flex flex-col justify-between">
            <div className="display-serif text-7xl md:text-8xl text-primary leading-none glow-text">
              {s.k}
            </div>
            <div>
              <div className="font-display text-sm uppercase tracking-wider mb-1">{s.label}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
