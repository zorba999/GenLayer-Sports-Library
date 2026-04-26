"""
Sports Library local proxy server.
Serves the UI and provides /api/* endpoints using free sports APIs (ESPN, Ergast).
No API key needed. Replaces gen_call for instant results while keeping Bradbury branding.

Run: python ui/server.py
"""
import json, urllib.request, urllib.parse, re, sys, os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json,*/*'})
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode('utf-8'))

# ──────────────────────────────────────────────────────────────────
# FOOTBALL (Soccer) — ESPN API
# ──────────────────────────────────────────────────────────────────
FINISHED_STATUSES = {'STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_FT', 'STATUS_END_GAME', 'STATUS_POSTPONED'}
ONGOING_STATUSES  = {'STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_END_PERIOD', 'STATUS_LIVE'}
UPCOMING_STATUSES = {'STATUS_SCHEDULED', 'STATUS_PREGAME', 'STATUS_PRE_GAME', 'STATUS_WARMUP'}

def _match_name(query, names):
    q = query.lower().strip()
    return any(q in n or n in q for n in names)

def get_football_result(team1, team2, game_date):
    try:
        date_compact = game_date.replace('-', '')
        for league in ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions', 'uefa.europa']:
            url = f'https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates={date_compact}'
            try:
                data = fetch(url)
            except Exception:
                continue
            for event in data.get('events', []):
                comp = event.get('competitions', [{}])[0]
                competitors = comp.get('competitors', [])
                if len(competitors) < 2: continue
                names = [c.get('team', {}).get('displayName', '').lower() for c in competitors]
                short = [c.get('team', {}).get('shortDisplayName', '').lower() for c in competitors]
                all_n = names + short
                if _match_name(team1, all_n) and _match_name(team2, all_n):
                    status_type = event.get('status', {}).get('type', {}).get('name', '')
                    scores = [int(c.get('score') or 0) for c in competitors]
                    # Use winner flag from API if available
                    wins = [c.get('winner', False) for c in competitors]
                    # Map to team1/team2 indices
                    idx1 = 0 if _match_name(team1, [names[0], short[0]]) else 1
                    idx2 = 1 - idx1
                    s1, s2 = scores[idx1], scores[idx2]
                    if status_type in FINISHED_STATUSES:
                        winner = 1 if wins[idx1] else (2 if wins[idx2] else (1 if s1>s2 else (2 if s2>s1 else 0)))
                        return {'winner': winner, 'score': f'{s1}:{s2}', 'status': 'finished'}
                    elif status_type in UPCOMING_STATUSES:
                        return {'winner': -1, 'score': '-', 'status': 'upcoming'}
                    else:
                        return {'winner': -1, 'score': f'{s1}:{s2}', 'status': 'ongoing'}
        return {'winner': -1, 'score': '-', 'status': 'not_found'}
    except Exception as e:
        return {'winner': -1, 'score': '-', 'status': 'not_found', 'error': str(e)}

# ──────────────────────────────────────────────────────────────────
# BASKETBALL (NBA) — ESPN API
# ──────────────────────────────────────────────────────────────────
def get_basketball_result(team1, team2, game_date):
    try:
        date_compact = game_date.replace('-', '')
        url = f'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={date_compact}'
        data = fetch(url)
        t1 = team1.lower(); t2 = team2.lower()
        for event in data.get('events', []):
            competitors = event.get('competitions', [{}])[0].get('competitors', [])
            if len(competitors) < 2: continue
            names = [c.get('team', {}).get('displayName', '').lower() for c in competitors]
            short = [c.get('team', {}).get('shortDisplayName', '').lower() for c in competitors]
            all_names = names + short
            if _match_name(team1, all_names) and _match_name(team2, all_names):
                status_type = event.get('status', {}).get('type', {}).get('name', '')
                scores = [int(c.get('score') or 0) for c in competitors]
                wins = [c.get('winner', False) for c in competitors]
                idx1 = 0 if _match_name(team1, [names[0], short[0]]) else 1
                idx2 = 1 - idx1
                s1, s2 = scores[idx1], scores[idx2]
                if status_type in FINISHED_STATUSES:
                    winner = 1 if wins[idx1] else (2 if wins[idx2] else (1 if s1>s2 else (2 if s2>s1 else -1)))
                    return {'winner': winner, 'score': f'{s1}:{s2}', 'status': 'finished'}
                elif status_type in UPCOMING_STATUSES:
                    return {'winner': -1, 'score': '-', 'status': 'upcoming'}
                else:
                    return {'winner': -1, 'score': f'{s1}:{s2}', 'status': 'ongoing'}
        return {'winner': -1, 'score': '-', 'status': 'not_found'}
    except Exception as e:
        return {'winner': -1, 'score': '-', 'status': 'not_found', 'error': str(e)}

# ──────────────────────────────────────────────────────────────────
# FORMULA 1 — Ergast API (free, no key)
# ──────────────────────────────────────────────────────────────────
def get_f1_race_winner(race_name, year):
    try:
        # Use Jolpica API (Ergast successor) — free, no key
        url = f'https://api.jolpi.ca/ergast/f1/{year}/results/1.json?limit=25'
        data = fetch(url)
        races = data.get('MRData', {}).get('RaceTable', {}).get('Races', [])
        race_name_lower = race_name.lower()
        # Flexible matching: remove "Grand Prix"/"GP" for comparison
        short = race_name_lower.replace('grand prix', '').replace('gp', '').strip()
        for race in races:
            rn = race.get('raceName', '').lower()
            circuit = race.get('Circuit', {}).get('circuitName', '').lower()
            locality = race.get('Circuit', {}).get('Location', {}).get('locality', '').lower()
            country = race.get('Circuit', {}).get('Location', {}).get('country', '').lower()
            targets = [rn, circuit, locality, country]
            if any(short in x or x in short for x in targets):
                results = race.get('Results', [])
                if results:
                    winner_info = results[0]
                    driver = winner_info.get('Driver', {})
                    name = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
                    team = winner_info.get('Constructor', {}).get('name', 'unknown')
                    return {'winner': name, 'team': team, 'status': 'finished'}
                else:
                    return {'winner': 'unknown', 'team': 'unknown', 'status': 'upcoming'}
        # Not found in results — maybe upcoming
        # Fetch full schedule to check
        sched_url = f'https://api.jolpi.ca/ergast/f1/{year}.json'
        sched = fetch(sched_url)
        for race in sched.get('MRData', {}).get('RaceTable', {}).get('Races', []):
            rn = race.get('raceName', '').lower()
            locality = race.get('Circuit', {}).get('Location', {}).get('locality', '').lower()
            country = race.get('Circuit', {}).get('Location', {}).get('country', '').lower()
            if any(short in x or x in short for x in [rn, locality, country]):
                return {'winner': 'unknown', 'team': 'unknown', 'status': 'upcoming'}
        return {'winner': 'unknown', 'team': 'unknown', 'status': 'not_found'}
    except Exception as e:
        return {'winner': 'unknown', 'team': 'unknown', 'status': 'not_found', 'error': str(e)}

# ──────────────────────────────────────────────────────────────────
# TENNIS — ESPN API
# ──────────────────────────────────────────────────────────────────
def get_tennis_result(player1, player2, tournament):
    try:
        # Try ATP and WTA
        for league in ['atp', 'wta']:
            url = f'https://site.api.espn.com/apis/site/v2/sports/tennis/{league}/scoreboard'
            try:
                data = fetch(url)
            except Exception:
                continue
            p1 = player1.lower(); p2 = player2.lower()
            for event in data.get('events', []):
                # Check name or tournament match
                event_name = event.get('name', '').lower()
                tour = tournament.lower()
                # Check if tournament matches
                tour_short = tour.split()[0] if tour else ''
                if tour_short and tour_short not in event_name:
                    continue
                competitors = event.get('competitions', [{}])[0].get('competitors', [])
                if len(competitors) < 2: continue
                names = [c.get('athlete', {}).get('displayName', '').lower() for c in competitors]
                if any(p1 in n or n in p1 for n in names) and any(p2 in n or n in p2 for n in names):
                    status_type = event.get('status', {}).get('type', {}).get('name', '')
                    idx1 = 0 if any(p1 in n or n in p1 for n in [names[0]]) else 1
                    idx2 = 1 - idx1
                    if status_type == 'STATUS_FINAL':
                        sets1 = competitors[idx1].get('score', '-')
                        sets2 = competitors[idx2].get('score', '-')
                        s1 = int(sets1) if str(sets1).isdigit() else 0
                        s2 = int(sets2) if str(sets2).isdigit() else 0
                        winner = 1 if s1 > s2 else (2 if s2 > s1 else -1)
                        return {'winner': winner, 'sets': f'{s1}:{s2}', 'status': 'finished'}
                    elif status_type == 'STATUS_SCHEDULED':
                        return {'winner': -1, 'sets': '-', 'status': 'upcoming'}
                    else:
                        return {'winner': -1, 'sets': '-', 'status': 'ongoing'}
        return {'winner': -1, 'sets': '-', 'status': 'not_found'}
    except Exception as e:
        return {'winner': -1, 'sets': '-', 'status': 'not_found', 'error': str(e)}

# ──────────────────────────────────────────────────────────────────
# HTTP Server
# ──────────────────────────────────────────────────────────────────
UI_DIR = os.path.join(os.path.dirname(__file__))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=UI_DIR, **kwargs)

    def log_message(self, fmt, *args):
        print(f'  {fmt % args}')

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = dict(urllib.parse.parse_qsl(parsed.query))

        if parsed.path == '/api/football':
            result = get_football_result(
                params.get('team1', ''), params.get('team2', ''), params.get('date', ''))
            self.send_json(result)

        elif parsed.path == '/api/basketball':
            result = get_basketball_result(
                params.get('team1', ''), params.get('team2', ''), params.get('date', ''))
            self.send_json(result)

        elif parsed.path == '/api/f1':
            result = get_f1_race_winner(
                params.get('race', ''), int(params.get('year', datetime.now().year)))
            self.send_json(result)

        elif parsed.path == '/api/tennis':
            result = get_tennis_result(
                params.get('player1', ''), params.get('player2', ''),
                params.get('tournament', ''))
            self.send_json(result)

        elif parsed.path == '/api/ping':
            self.send_json({'ok': True})

        else:
            super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    print(f'Sports Library UI + API server on http://localhost:{port}')
    print(f'  /api/football?team1=Arsenal&team2=Chelsea&date=2025-04-20')
    print(f'  /api/basketball?team1=Lakers&team2=Celtics&date=2025-04-25')
    print(f'  /api/f1?race=Monaco Grand Prix&year=2025')
    print(f'  /api/tennis?player1=Alcaraz&player2=Djokovic&tournament=Roland Garros 2025')
    HTTPServer(('', port), Handler).serve_forever()
