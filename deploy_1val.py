"""
Deploy sports_lib.py to Bradbury with 1 validator.
Uses eth_account to sign, web3 to send.
"""
import json, sys
from eth_account import Account
from web3 import Web3
from eth_abi import encode as abi_encode

RPC = 'https://rpc-bradbury.genlayer.com'
CONSENSUS = '0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D'
CHAIN_ID = 4221

# Load keystore
with open('tmp_key.json') as f:
    ks = json.load(f)
account = Account.from_key(Account.decrypt(ks, 'password123'))
print(f'Deployer: {account.address}')

w3 = Web3(Web3.HTTPProvider(RPC, request_kwargs={'headers': {'Origin':'http://localhost:3000','User-Agent':'Mozilla/5.0'}}))
print(f'Connected: {w3.is_connected()}')

# Read contract code
with open('sports_lib.py', 'rb') as f:
    code_bytes = f.read()
print(f'Code size: {len(code_bytes)} bytes')

# GL Encode helpers
def write_uleb(out, n):
    n = int(n)
    while True:
        b = n & 0x7F; n >>= 7
        if n: out.append(b | 0x80)
        else: out.append(b); return

def encode_val(out, v):
    if v is None:
        write_uleb(out, 0)
    elif isinstance(v, str):
        b = v.encode('utf-8')
        write_uleb(out, (len(b) << 3) | 4)
        out.extend(b)
    elif isinstance(v, list):
        write_uleb(out, (len(v) << 3) | 5)
        for x in v: encode_val(out, x)
    elif isinstance(v, dict):
        items = sorted(v.items())
        write_uleb(out, (len(items) << 3) | 6)
        for k, val in items:
            kb = k.encode('utf-8')
            write_uleb(out, len(kb))
            out.extend(kb)
            encode_val(out, val)

def rlp_enc_bytes(b):
    b = bytes(b)
    if len(b) == 1 and b[0] < 0x80: return b
    if len(b) < 56: return bytes([0x80 + len(b)]) + b
    l = len(b); lb = []
    while l: lb.insert(0, l & 0xff); l >>= 8
    return bytes([0xb7 + len(lb)] + lb) + b

def rlp_enc_list(items):
    payload = b''.join(rlp_enc_bytes(x) for x in items)
    if len(payload) < 56: return bytes([0xc0 + len(payload)]) + payload
    l = len(payload); lb = []
    while l: lb.insert(0, l & 0xff); l >>= 8
    return bytes([0xf7 + len(lb)] + lb) + payload

# Constructor calldata = encode4({}) = ULEB128(0 << 3 | 6) = 0x06 (empty map)
# matches genlayer-js: encode4(makeCalldataObject(undefined, [], {})) = encode4({})
constructor_calldata = bytes([0x06])

# txData = RLP([code_bytes, constructor_calldata, false=0x00])
# matches: serialize([code, encode4({}), false]) = toRlp([toHex(code), "0x06", "0x00"])
tx_data_inner = rlp_enc_list([code_bytes, constructor_calldata, b'\x00'])

# addTransaction ABI
ADD_TX_SIG = b'\xf4\x2a\x47\x72'  # keccak256("addTransaction(address,address,uint256,uint256,bytes,uint256)")[:4]
# Let me compute it:
import hashlib
sig_full = 'addTransaction(address,address,uint256,uint256,bytes,uint256)'
selector = Web3.keccak(text=sig_full)[:4]
print(f'Selector: {selector.hex()}')

# Encode parameters
sender = account.address
recipient = '0x0000000000000000000000000000000000000000'  # null = deploy
num_validators = 1
max_rotations = 0
valid_until = 0

# ABI encode the function call
from eth_abi import encode
params_encoded = encode(
    ['address', 'address', 'uint256', 'uint256', 'bytes', 'uint256'],
    [sender, recipient, num_validators, max_rotations, tx_data_inner, valid_until]
)
data = selector + params_encoded

# Get nonce
nonce = w3.eth.get_transaction_count(account.address)
print(f'Nonce: {nonce}')

# Build and sign tx
tx = {
    'to': Web3.to_checksum_address(CONSENSUS),
    'data': data,
    'gas': 2_000_000,
    'gasPrice': Web3.to_wei('1', 'gwei'),
    'nonce': nonce,
    'chainId': CHAIN_ID,
}

signed = account.sign_transaction(tx)
print('Sending TX...')
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print(f'TX hash: {tx_hash.hex()}')

print('Waiting for receipt...')
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
print(f'Status: {receipt.status}')
print(f'Block: {receipt.blockNumber}')
print(f'Logs: {len(receipt.logs)}')
for log in receipt.logs:
    print(f'  Log topic[0]: {log.topics[0].hex() if log.topics else "none"}')
    print(f'  Log data: {log.data.hex()[:100]}')
