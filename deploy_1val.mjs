/**
 * Deploy sports_lib.py to Bradbury using 1 validator (instead of default 5).
 * This gives a much better chance of succeeding if at least 1 validator is online.
 */
import { readFileSync } from 'fs';
import { createWalletClient, createPublicClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethers } from 'ethers';

const { Wallet, JsonRpcProvider, Interface, toUtf8Bytes, keccak256 } = ethers;

const RPC = 'https://rpc-bradbury.genlayer.com';
const CONSENSUS = '0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D';
const CHAIN_ID = 4221;

// Load keystore
const ks = JSON.parse(readFileSync('./tmp_key.json', 'utf8'));
const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const wallet = await Wallet.fromEncryptedJson(JSON.stringify(ks), 'password123');
const signer = wallet.connect(provider);

console.log('Deployer:', await signer.getAddress());

// Read contract code
const code = readFileSync('./sports_lib.py');
const codeHex = '0x' + code.toString('hex');

// GL encode helpers
function writeULEB(out, n) {
  n = BigInt(n);
  while (true) {
    let b = Number(n & 0x7fn);
    n >>= 7n;
    if (n) { out.push(b | 0x80); } else { out.push(b); break; }
  }
}
function encodeVal(out, v) {
  if (v === null) { writeULEB(out, 0n); }
  else if (typeof v === 'string') {
    const b = new TextEncoder().encode(v);
    writeULEB(out, BigInt(b.length << 3) | 4n);
    out.push(...b);
  } else if (Array.isArray(v)) {
    writeULEB(out, BigInt(v.length << 3) | 5n);
    v.forEach(x => encodeVal(out, x));
  } else if (typeof v === 'object') {
    const entries = Object.entries(v).sort(([a], [b]) => a < b ? -1 : 1);
    writeULEB(out, BigInt(entries.length << 3) | 6n);
    for (const [k, val] of entries) {
      const kb = new TextEncoder().encode(k);
      writeULEB(out, BigInt(kb.length));
      out.push(...kb);
      encodeVal(out, val);
    }
  }
}
function rlpBytes(b) {
  b = Uint8Array.from(b);
  if (b.length === 1 && b[0] < 0x80) return b;
  if (b.length < 56) return Uint8Array.from([0x80 + b.length, ...b]);
  const lb = [];
  let l = b.length;
  while (l > 0) { lb.unshift(l & 0xff); l >>= 8; }
  return Uint8Array.from([0xb7 + lb.length, ...lb, ...b]);
}
function rlpList(items) {
  const payload = items.flatMap(x => [...rlpBytes(x)]);
  if (payload.length < 56) return Uint8Array.from([0xc0 + payload.length, ...payload]);
  const lb = [];
  let l = payload.length;
  while (l > 0) { lb.unshift(l & 0xff); l >>= 8; }
  return Uint8Array.from([0xf7 + lb.length, ...lb, ...payload]);
}
function glSerialize(obj) {
  const inner = [];
  encodeVal(inner, obj);
  const rlp = rlpList([Uint8Array.from(inner), Uint8Array.from([0x00])]);
  return '0x' + Array.from(rlp, b => b.toString(16).padStart(2, '0')).join('');
}

// Deploy calldata: constructor call
const deployCalldata = glSerialize({ method: '__init__', args: [] });

// addTransaction ABI — 6 args
const ABI = new Interface([
  'function addTransaction(address _sender, address _recipient, uint256 _numOfInitialValidators, uint256 _maxRotations, bytes _txData, uint256 _validUntil)'
]);

// Encode the inner deploy payload: [codeHex, args=[], leaderOnly=false]
// The txData for a deploy is: rlp([code_bytes, calldata_bytes, leaderOnly_bool])
function rlpBytesFromHex(hex) {
  const b = Uint8Array.from(Buffer.from(hex.slice(2), 'hex'));
  return rlpBytes(b);
}
function rlpBool(v) {
  return rlpBytes(Uint8Array.from([v ? 0x01 : 0x00]));
}

// txData = RLP([code, deployCalldata, leaderOnly])
const codeBytes = Buffer.from(codeHex.slice(2), 'hex');
const calldataBytes = Buffer.from(deployCalldata.slice(2), 'hex');
const innerRlp = rlpList([codeBytes, calldataBytes, new Uint8Array([0x00])]);
const txData = '0x' + Buffer.from(innerRlp).toString('hex');

const senderAddr = await signer.getAddress();
const deployAddr = '0x0000000000000000000000000000000000000000'; // null address = deploy

const data = ABI.encodeFunctionData('addTransaction', [
  senderAddr,
  deployAddr,
  1n,   // 1 validator only!
  0n,   // 0 max rotations
  txData,
  0n    // validUntil = 0 (no expiry)
]);

console.log('Sending deploy with 1 validator...');
const nonce = await provider.getTransactionCount(senderAddr);
console.log('Nonce:', nonce);

const tx = await signer.sendTransaction({
  to: CONSENSUS,
  data,
  gasLimit: 2000000n,
  gasPrice: parseGwei('1'),
  nonce,
  chainId: CHAIN_ID,
  type: 0
});

console.log('ETH TX hash:', tx.hash);
console.log('Waiting for ETH receipt...');
const receipt = await tx.wait();
console.log('ETH status:', receipt.status);
console.log('Logs:', receipt.logs.length, 'events');
if (receipt.logs.length > 0) {
  console.log('First log topics:', receipt.logs[0].topics);
}
