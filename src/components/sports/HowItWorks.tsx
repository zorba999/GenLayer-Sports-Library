const steps = [
  {
    n: "01",
    title: "Call the library",
    body: "Your contract invokes SportsLib.get_football_result(team1, team2, date) like any helper.",
  },
  {
    n: "02",
    title: "Validators consult reality",
    body: "GenLayer validators independently query trusted sources via the LLM-powered web equivalence layer.",
  },
  {
    n: "03",
    title: "Optimistic consensus",
    body: "Validators reach agreement on a single normalized result. Disputes trigger appeal rounds — not your concern.",
  },
  {
    n: "04",
    title: "Settle on-chain",
    body: "The verdict lands in storage. Bets resolve. Markets close. Fans get paid. Trustlessly.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="border-y border-border/60 bg-surface/40">
      <div className="container-grid py-24 md:py-32">
        <div className="mb-20 max-w-3xl">
          <p className="label-mono mb-4">003 / Mechanism</p>
          <h2 className="display-serif text-5xl md:text-6xl tracking-tight leading-[0.95]">
            From whistle <span className="italic text-muted-foreground">to</span> ledger,
            <br />in four moves.
          </h2>
        </div>

        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative bg-background p-8 min-h-[260px] flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm text-primary">{s.n}</span>
                <span className="h-2 w-2 rounded-full bg-border" />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-tight mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
