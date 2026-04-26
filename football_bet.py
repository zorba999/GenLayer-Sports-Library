# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import typing


# ─── SportsLib (inlined) ──────────────────────────────────────────────────────
# Copy this class from sports_lib.py into any contract that needs sports data.

class SportsLib:
    @staticmethod
    def get_football_result(team1: str, team2: str, game_date: str) -> dict:
        url = f"https://www.bbc.com/sport/football/scores-fixtures/{game_date}"

        def nondet() -> str:
            response = gl.nondet.web.get(url)
            web_data = response.body.decode("utf-8")
            task = f"""Find the football match result between:
Team 1: {team1}
Team 2: {team2}

Web content:
{web_data}
--- End ---

Rules:
- "Kick off [time]" between team names means game not started yet (status=upcoming)
- Game in progress: winner=-1, status=ongoing
- Match not found: winner=-1, status=not_found

Respond ONLY with valid JSON, no markdown:
{{
    "winner": <int>,
    "score": <str>,
    "status": <str>
}}
winner: 1={team1} wins, 2={team2} wins, 0=draw, -1=not finished
score: "g1:g2" e.g. "2:1" or "-"
status: "finished" | "ongoing" | "upcoming" | "not_found"
"""
            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(nondet))


# ─── FootballBet Contract ─────────────────────────────────────────────────────
#
# A simple 1v1 football bet:
#   1. Creator deploys the contract with team names + match date
#   2. Bettor 1 calls bet_on_team1() and sends GEN tokens
#   3. Bettor 2 calls bet_on_team2() and sends the same amount
#   4. Anyone calls resolve() after the match — winner gets both deposits
#   5. On draw: each bettor gets their deposit back (refund)
#
# Deploy on Bradbury:
#   genlayer contracts deploy football_bet.py \
#     --args '["Arsenal", "Chelsea", "2025-05-10"]' \
#     --rpc https://rpc-bradbury.genlayer.com

class FootballBet(gl.Contract):
    team1: str
    team2: str
    game_date: str
    bettor1: str
    bettor2: str
    bet_amount: int
    resolved: bool
    winner: int
    score: str

    def __init__(self, team1: str, team2: str, game_date: str):
        self.team1 = team1
        self.team2 = team2
        self.game_date = game_date
        self.bettor1 = ""
        self.bettor2 = ""
        self.bet_amount = 0
        self.resolved = False
        self.winner = -1
        self.score = "-"

    # ── Views ──────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_state(self) -> dict:
        return {
            "team1": self.team1,
            "team2": self.team2,
            "game_date": self.game_date,
            "bettor1": self.bettor1,
            "bettor2": self.bettor2,
            "bet_amount": self.bet_amount,
            "resolved": self.resolved,
            "winner": self.winner,
            "score": self.score,
        }

    @gl.public.view
    def is_ready_to_resolve(self) -> bool:
        return self.bettor1 != "" and self.bettor2 != "" and not self.resolved

    # ── Betting ────────────────────────────────────────────────────────────────

    @gl.public.write.payable
    def bet_on_team1(self):
        assert self.bettor1 == "", "Someone already bet on team 1"
        assert not self.resolved, "Bet is already resolved"
        assert gl.message.value > 0, "Must send GEN tokens to bet"

        self.bettor1 = gl.message.sender_account
        self.bet_amount = gl.message.value

    @gl.public.write.payable
    def bet_on_team2(self):
        assert self.bettor2 == "", "Someone already bet on team 2"
        assert not self.resolved, "Bet is already resolved"
        assert self.bettor1 != "", "Bettor 1 must place their bet first"
        assert gl.message.value == self.bet_amount, "Must match bettor 1's amount"

        self.bettor2 = gl.message.sender_account

    # ── Resolution ─────────────────────────────────────────────────────────────

    @gl.public.write
    def resolve(self) -> dict:
        assert not self.resolved, "Bet is already resolved"
        assert self.bettor1 != "" and self.bettor2 != "", "Both bettors must place their bets first"

        result = SportsLib.get_football_result(self.team1, self.team2, self.game_date)

        assert result["status"] == "finished", f"Match is not finished yet (status: {result['status']})"

        self.resolved = True
        self.winner = result["winner"]
        self.score = result["score"]

        total_pool = self.bet_amount * 2

        if self.winner == 1:
            gl.contract.transfer(self.bettor1, total_pool)
        elif self.winner == 2:
            gl.contract.transfer(self.bettor2, total_pool)
        else:
            # Draw: refund each bettor
            gl.contract.transfer(self.bettor1, self.bet_amount)
            gl.contract.transfer(self.bettor2, self.bet_amount)

        return result
