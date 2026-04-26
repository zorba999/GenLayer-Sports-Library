const code = `from genlayer import *
from sports_lib import SportsLib

class FootballBet(gl.Contract):
    team1: str
    team2: str
    pool_team1: dict[Address, u256]
    pool_team2: dict[Address, u256]
    result: dict

    def __init__(self, team1: str, team2: str, date: str):
        self.team1, self.team2, self.date = team1, team2, date

    @gl.public.write.payable
    def bet_on_team1(self):
        self.pool_team1[gl.message.sender] += gl.message.value

    @gl.public.write
    def resolve(self):
        # Real-world result, fetched by GenLayer validators.
        self.result = SportsLib.get_football_result(
            self.team1, self.team2, self.date
        )
        # → { "winner": 1, "score": "2:1", "status": "finished" }
        if self.result["winner"] == 1:
            self._payout(self.pool_team1)`;

const CodeShowcase = () => {
  return (
    <section id="api" className="container-grid py-24 md:py-32">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <p className="label-mono mb-4">004 / Drop-in</p>
          <h2 className="display-serif text-5xl md:text-6xl tracking-tight leading-[0.95] mb-6">
            Less than <span className="text-primary">30 lines</span> to a
            trust-minimised sportsbook.
          </h2>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Import the library, point it at a fixture, settle when the final
            whistle blows. The validator network handles the messy part —
            disambiguating sources, tolerating outages, ignoring the wrong
            "Manchester United" of three.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-primary/30 via-transparent to-pitch/30 blur-md opacity-50 rounded-sm" />
            <div className="relative bg-surface-elevated border border-border rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  football_bet.py
                </span>
                <span className="label-mono">live</span>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-[1.7]">
                <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
              </pre>
            </div>
          </div>

          {/* CLI */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <CliBlock label="install" cmd="pip install genlayer" />
            <CliBlock
              label="deploy"
              cmd="genlayer contracts deploy football_bet.py"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const CliBlock = ({ label, cmd }: { label: string; cmd: string }) => (
  <div className="bg-surface border border-border p-4 rounded-sm">
    <div className="label-mono mb-2 text-primary">$ {label}</div>
    <pre className="font-mono text-xs text-foreground/90 overflow-x-auto">{cmd}</pre>
  </div>
);

// Tiny syntax highlighter — keyword/string/comment only, theme via design tokens
function highlight(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(src)
    .replace(/(#.*$)/gm, '<span style="color:hsl(var(--muted-foreground));font-style:italic">$1</span>')
    .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"]*"|'[^']*')/g,
      '<span style="color:hsl(var(--primary))">$1</span>')
    .replace(/\b(from|import|class|def|self|return|if|in|None|True|False)\b/g,
      '<span style="color:hsl(var(--accent));font-weight:500">$1</span>')
    .replace(/(@gl\.[a-z.]+)/g, '<span style="color:hsl(var(--pitch-glow))">$1</span>')
    .replace(/\b(SportsLib|FootballBet|Address|gl|u256)\b/g,
      '<span style="color:hsl(60 14% 94%);font-weight:500">$1</span>');
}

export default CodeShowcase;
