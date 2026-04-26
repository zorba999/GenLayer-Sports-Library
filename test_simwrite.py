"""Test gen_call type:write simulation against existing contract."""
import urllib.request, json

# GenLayer calldata encoding
T_SPECIAL, T_PINT, T_NINT, T_BYTES, T_STR, T_ARR, T_MAP = 0, 1, 2, 3, 4, 5, 6

def write_uleb(out, n):
    n = int(n)
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return

def write_typed(out, n, t):
    write_uleb(out, (int(n) << 3) | t)

def encode_val(out, v):
    if v is None:
        write_typed(out, 0, T_SPECIAL)
    elif isinstance(v, bool):
        write_typed(out, 2 if v else 1, T_SPECIAL)  # 8 or 16? actually special=0 with subvalue
    elif isinstance(v, int):
        if v >= 0:
            write_typed(out, v, T_PINT)
        else:
            write_typed(out, -v - 1, T_NINT)
    elif isinstance(v, str):
        b = v.encode('utf-8')
        write_typed(out, len(b), T_STR)
        out.extend(b)
    elif isinstance(v, list):
        write_typed(out, len(v), T_ARR)
        for it in v:
            encode_val(out, it)
    elif isinstance(v, dict):
        items = sorted(v.items(), key=lambda kv: kv[0])
        write_typed(out, len(items), T_MAP)
        for k, vv in items:
            kb = k.encode('utf-8')
            write_uleb(out, len(kb))
            out.extend(kb)
            encode_val(out, vv)

def gl_encode(v):
    out = bytearray()
    encode_val(out, v)
    return bytes(out)

# RLP
def rlp_encode_bytes(b):
    if len(b) == 1 and b[0] < 0x80:
        return b
    if len(b) < 56:
        return bytes([0x80 + len(b)]) + b
    lb = len(b).to_bytes((len(b).bit_length() + 7) // 8, 'big')
    return bytes([0xb7 + len(lb)]) + lb + b

def rlp_encode_list(items):
    payload = b''.join(rlp_encode_bytes(x) for x in items)
    if len(payload) < 56:
        return bytes([0xc0 + len(payload)]) + payload
    lb = len(payload).to_bytes((len(payload).bit_length() + 7) // 8, 'big')
    return bytes([0xf7 + len(lb)]) + lb + payload

def serialize(calldata_obj):
    inner = gl_encode(calldata_obj)
    rlp = rlp_encode_list([inner, b'\x00'])
    return '0x' + rlp.hex()

# Build calldata for check_football("Arsenal", "Chelsea", "2025-04-20")
calldata = {
    "method": "check_football",
    "args": ["Arsenal", "Chelsea", "2025-04-20"]
}
data = serialize(calldata)
print("calldata:", data)

# Send gen_call type:write
req = urllib.request.Request(
    'https://rpc-bradbury.genlayer.com',
    data=json.dumps({
        'jsonrpc': '2.0',
        'method': 'gen_call',
        'params': [{
            'type': 'read',
            'to': '0x5d5d5b3a451a6dfbf8bc4f63578711e71b438855',
            'from': '0x0000000000000000000000000000000000000000',
            'data': data,
            'transaction_hash_variant': 'latest-nonfinal'
        }],
        'id': 1
    }).encode(),
    headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:3000', 'User-Agent':'Mozilla/5.0'}
)
print("Sending gen_call type:write...")
try:
    resp = urllib.request.urlopen(req, timeout=300).read().decode()
    print("Response:")
    print(resp)
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.reason}")
    print("Body:", e.read().decode())
