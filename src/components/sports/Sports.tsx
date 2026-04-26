type Sport = {
  id: string;
  name: string;
  league: string;
  example: { left: string; right: string; score: string };
  payload: string;
};

const sports: Sport[] = [
  {
    id: "01",
    name: "Football",
    league: "EPL · LaLiga · Serie A",
    example: { left: "Arsenal", right: "Chelsea", score: "2:1" },
    payload: `{ "winner": 1, "score": "2:1", "status": "finished" }`,
  },
  {
    id: "02",
    name: "Basketball",
    league: "NBA · EuroLeague",
    example: { left: "Lakers", right: "Celtics", score: "112:108" },
    payload: `{ "winner": 1, "score": "112:108", "status": "finished" }`,
  },
  {
    id: "03",
    name: "Formula 1",
    league: "FIA World Championship",
    example: { left: "Verstappen", right: "Red Bull", score: "P1" },
    payload: `{ "winner": "Max Verstappen", "team": "Red Bull", "status": "finished" }`,
  },
  {
    id: "04",
    name: "Tennis",
    league: "ATP · WTA · Grand Slam",
    example: { left: "Alcaraz", right: "Sinner", score: "3:1" },
    payload: `{ "winner": 1, "sets": "3:1", "status": "finished" }`,
  },
];

const Sports = () => {
  return (
    <section id="sports" className="container-grid py-24 md:py-32">
      <div className="grid md:grid-cols-12 gap-10 mb-16">
        <div className="md:col-span-4">
          <p className="label-mono mb-4">002 / Coverage</p>
          <h2 className="display-serif text-5xl md:text-6xl leading-[0.95] tracking-tight">
            Four sports.<br />
            <span className="text-primary">One signature.</span>
          </h2>
        </div>
        <p className="md:col-span-7 md:col-start-6 text-lg text-muted-foreground text-pretty self-end">
          A single deterministic call returns a normalized result your contract
          can act on — winner, score, status. No brittle scrapers, no centralized
          oracle: the verdict is reached by GenLayer's optimistic LLM consensus.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {sports.map((s) => (
          <article
            key={s.id}
            className="group relative bg-background hover:bg-surface-elevated transition-colors duration-500 p-8 md:p-10"
          >
            <div className="flex items-start justify-between mb-12">
              <span className="label-mono">{s.id}</span>
              <span className="label-mono text-foreground/70">{s.league}</span>
            </div>

            <h3 className="display-serif text-5xl md:text-6xl tracking-tight mb-10 transition-colors group-hover:text-primary">
              {s.name}
            </h3>

            <div className="flex items-center justify-between gap-6 mb-6">
              <span className="font-display text-lg text-foreground">{s.example.left}</span>
              <span className="font-mono text-2xl text-primary tabular-nums">{s.example.score}</span>
              <span className="font-display text-lg text-foreground text-right">{s.example.right}</span>
            </div>

            <div className="hairline mb-6" />

            <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
              <span className="text-primary/70">→ </span>
              {s.payload}
            </pre>

            <div className="absolute bottom-0 left-0 h-px w-0 bg-primary group-hover:w-full transition-all duration-700 ease-out" />
          </article>
        ))}
      </div>
    </section>
  );
};

export default Sports;
