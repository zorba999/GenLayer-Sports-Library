# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import typing


class SportsLib:
    """
    Sports Data Library for GenLayer Intelligent Contracts.
    Supports: Football, Basketball (NBA), Formula 1, Tennis.

    Data sources (no API key needed):
      - Football   : BBC Sport
      - Basketball : ESPN
      - Formula 1  : BBC Sport
      - Tennis     : BBC Sport

    Compatible with Bradbury Testnet (Chain ID: 4221)
    RPC: https://rpc-bradbury.genlayer.com
    """

    # ─── Football ─────────────────────────────────────────────────────────────

    @staticmethod
    def get_football_result(team1: str, team2: str, game_date: str) -> dict:
        """
        Fetch football match result from BBC Sport.

        Args:
            team1     : First team name  (e.g. "Arsenal")
            team2     : Second team name (e.g. "Chelsea")
            game_date : Match date in YYYY-MM-DD format

        Returns dict:
            winner : 1=team1 wins, 2=team2 wins, 0=draw, -1=not finished
            score  : "goals1:goals2"  e.g. "2:1",  or "-" if not finished
            status : "finished" | "ongoing" | "upcoming" | "not_found"
        """
        url = f"https://www.bbc.com/sport/football/scores-fixtures/{game_date}"

        def nondet() -> str:
            response = gl.nondet.web.get(url)
            web_data = response.body.decode("utf-8")

            task = f"""In the following web page, find the result of a football match between:
Team 1: {team1}
Team 2: {team2}

Web page content:
{web_data}
--- End of web page ---

Rules:
- If "Kick off [time]" appears between the two team names, the game has not started yet (status=upcoming)
- If the game is currently being played, winner=-1 and status=ongoing
- If you cannot find this specific match, winner=-1 and status=not_found
- Score format must be "goals_team1:goals_team2"  e.g. "2:1"

Respond ONLY with valid JSON, no extra text, no markdown:
{{
    "winner": <int>,
    "score": <str>,
    "status": <str>
}}"""

            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(nondet))

    # ─── Basketball (NBA) ─────────────────────────────────────────────────────

    @staticmethod
    def get_basketball_result(team1: str, team2: str, game_date: str) -> dict:
        """
        Fetch NBA game result from ESPN.

        Args:
            team1     : Team name (e.g. "Lakers")
            team2     : Team name (e.g. "Celtics")
            game_date : Date in YYYY-MM-DD format

        Returns dict:
            winner : 1=team1 wins, 2=team2 wins, -1=not finished/not found
            score  : "pts1:pts2"  e.g. "110:98",  or "-"
            status : "finished" | "ongoing" | "upcoming" | "not_found"
        """
        date_compact = game_date.replace("-", "")
        url = f"https://www.espn.com/nba/scoreboard/_/date/{date_compact}"

        def nondet() -> str:
            response = gl.nondet.web.get(url)
            web_data = response.body.decode("utf-8")

            task = f"""In the following ESPN scoreboard page, find the NBA game between:
Team 1: {team1}
Team 2: {team2}

Web page content:
{web_data}
--- End of web page ---

Respond ONLY with valid JSON, no extra text, no markdown:
{{
    "winner": <int>,
    "score": <str>,
    "status": <str>
}}
- winner : 1 if {team1} won, 2 if {team2} won, 0 for overtime draw, -1 if not finished or not found
- score  : "pts_team1:pts_team2"  e.g. "110:98",  or "-"
- status : "finished" | "ongoing" | "upcoming" | "not_found"
"""

            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(nondet))

    # ─── Formula 1 ────────────────────────────────────────────────────────────

    @staticmethod
    def get_f1_race_winner(race_name: str, year: int) -> dict:
        """
        Fetch Formula 1 race winner from BBC Sport.

        Args:
            race_name : Grand Prix name (e.g. "Monaco Grand Prix")
            year      : Season year     (e.g. 2025)

        Returns dict:
            winner : Driver full name  (e.g. "Max Verstappen") or "unknown"
            team   : Constructor name  (e.g. "Red Bull")        or "unknown"
            status : "finished" | "upcoming" | "not_found"
        """
        url = f"https://www.bbc.com/sport/formula1/{year}/results"

        def nondet() -> str:
            response = gl.nondet.web.get(url)
            web_data = response.body.decode("utf-8")

            task = f"""In the following web page, find the winner of the {race_name} ({year}).

Web page content:
{web_data}
--- End of web page ---

Respond ONLY with valid JSON, no extra text, no markdown:
{{
    "winner": <str>,
    "team": <str>,
    "status": <str>
}}
- winner : full driver name or "unknown"
- team   : constructor / team name or "unknown"
- status : "finished" | "upcoming" | "not_found"
"""

            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(nondet))

    # ─── Tennis ───────────────────────────────────────────────────────────────

    @staticmethod
    def get_tennis_result(player1: str, player2: str, tournament: str) -> dict:
        """
        Fetch tennis match result from BBC Sport.

        Args:
            player1    : Player name    (e.g. "Carlos Alcaraz")
            player2    : Player name    (e.g. "Novak Djokovic")
            tournament : Tournament     (e.g. "Wimbledon 2025")

        Returns dict:
            winner : 1=player1 wins, 2=player2 wins, -1=not finished/not found
            sets   : "sets1:sets2"  e.g. "3:1",  or "-"
            status : "finished" | "ongoing" | "upcoming" | "not_found"
        """
        url = "https://www.bbc.com/sport/tennis/scores-fixtures"

        def nondet() -> str:
            response = gl.nondet.web.get(url)
            web_data = response.body.decode("utf-8")

            task = f"""In the following web page, find the tennis match between:
Player 1: {player1}
Player 2: {player2}
Tournament: {tournament}

Web page content:
{web_data}
--- End of web page ---

Respond ONLY with valid JSON, no extra text, no markdown:
{{
    "winner": <int>,
    "sets": <str>,
    "status": <str>
}}
- winner : 1 if {player1} won, 2 if {player2} won, -1 if not finished or not found
- sets   : "sets_p1:sets_p2"  e.g. "3:1",  or "-"
- status : "finished" | "ongoing" | "upcoming" | "not_found"
"""

            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(nondet))


# ─── Demo Contract ────────────────────────────────────────────────────────────
# Deploy this on Bradbury to test the library interactively.
# RPC  : https://rpc-bradbury.genlayer.com
# Chain: 4221

class SportsLibDemo(gl.Contract):
    last_result: str  # JSON string — dict not supported in Genlayer storage

    def __init__(self):
        self.last_result = "{}"

    @gl.public.view
    def get_last_result(self) -> str:
        return self.last_result

    # ── Instant query methods (view — no transaction needed) ──────────────────
    # These run on a single node via gen_call type:read and return results
    # directly without blockchain consensus or state storage.

    @gl.public.view
    def query_football(self, team1: str, team2: str, game_date: str) -> str:
        return json.dumps(SportsLib.get_football_result(team1, team2, game_date))

    @gl.public.view
    def query_basketball(self, team1: str, team2: str, game_date: str) -> str:
        return json.dumps(SportsLib.get_basketball_result(team1, team2, game_date))

    @gl.public.view
    def query_f1(self, race_name: str, year: int) -> str:
        return json.dumps(SportsLib.get_f1_race_winner(race_name, year))

    @gl.public.view
    def query_tennis(self, player1: str, player2: str, tournament: str) -> str:
        return json.dumps(SportsLib.get_tennis_result(player1, player2, tournament))

    # ── Write methods (store result on-chain for audit trail) ─────────────────

    @gl.public.write
    def check_football(self, team1: str, team2: str, game_date: str):
        self.last_result = json.dumps(SportsLib.get_football_result(team1, team2, game_date))

    @gl.public.write
    def check_basketball(self, team1: str, team2: str, game_date: str):
        self.last_result = json.dumps(SportsLib.get_basketball_result(team1, team2, game_date))

    @gl.public.write
    def check_f1(self, race_name: str, year: int):
        self.last_result = json.dumps(SportsLib.get_f1_race_winner(race_name, year))

    @gl.public.write
    def check_tennis(self, player1: str, player2: str, tournament: str):
        self.last_result = json.dumps(SportsLib.get_tennis_result(player1, player2, tournament))
