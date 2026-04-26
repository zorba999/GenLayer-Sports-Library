# GenLayer Sports Data Library

A library for GenLayer Intelligent Contracts that fetches real sports results from public web sources — no API keys required.

## Supported Sports

| Sport      | Source    | Method                        |
|------------|-----------|-------------------------------|
| Football   | BBC Sport | `get_football_result()`       |
| Basketball | ESPN      | `get_basketball_result()`     |
| Formula 1  | BBC Sport | `get_f1_race_winner()`        |
| Tennis     | BBC Sport | `get_tennis_result()`         |

---

## Network: Bradbury Testnet

| Property      | Value                                  |
|---------------|----------------------------------------|
| RPC URL       | `https://rpc-bradbury.genlayer.com`    |
| Chain ID      | `4221`                                 |
| Currency      | `GEN`                                  |
| Explorer      | https://explorer-bradbury.genlayer.com |
| Faucet        | https://testnet-faucet.genlayer.foundation |

---

## Files

```
sports_lib.py       ← Main library (SportsLib class + demo contract)
football_bet.py     ← Example: 1v1 football betting contract
README.md           ← This file
```

---

## Setup

### 1. Install GenLayer CLI

```bash
pip install genlayer
```

### 2. Configure Bradbury network

```bash
genlayer config set rpc-url https://rpc-bradbury.genlayer.com
```

### 3. Create or import a wallet

```bash
genlayer accounts create
# or
genlayer accounts import --private-key YOUR_PRIVATE_KEY
```

### 4. Get testnet GEN tokens

Go to: https://testnet-faucet.genlayer.foundation

---

## Deploy & Test: SportsLibDemo

### Deploy

```bash
genlayer contracts deploy sports_lib.py \
  --rpc https://rpc-bradbury.genlayer.com
```

### Test football result

```bash
genlayer contracts call <CONTRACT_ADDRESS> check_football \
  --args '["Arsenal", "Chelsea", "2025-04-20"]' \
  --rpc https://rpc-bradbury.genlayer.com
```

### Read last result

```bash
genlayer contracts read <CONTRACT_ADDRESS> get_last_result \
  --rpc https://rpc-bradbury.genlayer.com
```

**Expected output:**
```json
{
  "winner": 1,
  "score": "2:1",
  "status": "finished"
}
```

---

## Deploy & Test: FootballBet

### Deploy (creator sets match details)

```bash
genlayer contracts deploy football_bet.py \
  --args '["Arsenal", "Chelsea", "2025-05-10"]' \
  --rpc https://rpc-bradbury.genlayer.com
```

### Bettor 1 bets on team 1

```bash
genlayer contracts call <CONTRACT_ADDRESS> bet_on_team1 \
  --value 1000000000000000000 \
  --rpc https://rpc-bradbury.genlayer.com
```

### Bettor 2 bets on team 2

```bash
genlayer contracts call <CONTRACT_ADDRESS> bet_on_team2 \
  --value 1000000000000000000 \
  --rpc https://rpc-bradbury.genlayer.com
```

### Resolve after match

```bash
genlayer contracts call <CONTRACT_ADDRESS> resolve \
  --rpc https://rpc-bradbury.genlayer.com
```

---

## How to use SportsLib in your own contract

Copy the `SportsLib` class into your contract file and call it directly:

```python
from genlayer import *
import json

class SportsLib:
    @staticmethod
    def get_football_result(team1, team2, game_date):
        # ... (copy from sports_lib.py)

class MyContract(gl.Contract):
    result: dict

    def __init__(self):
        self.result = {}

    @gl.public.write
    def check_match(self):
        self.result = SportsLib.get_football_result(
            "Real Madrid", "Barcelona", "2025-05-15"
        )
```

---

## Return values

### Football / Basketball
```json
{
  "winner": 1,
  "score": "2:1",
  "status": "finished"
}
```
- `winner`: `1` = team1 wins, `2` = team2 wins, `0` = draw, `-1` = not finished
- `score`: `"goals1:goals2"` or `"-"`
- `status`: `"finished"` | `"ongoing"` | `"upcoming"` | `"not_found"`

### Formula 1
```json
{
  "winner": "Max Verstappen",
  "team": "Red Bull",
  "status": "finished"
}
```

### Tennis
```json
{
  "winner": 1,
  "sets": "3:1",
  "status": "finished"
}
```
