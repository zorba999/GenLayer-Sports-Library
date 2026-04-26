import { createClient, http } from 'viem';
import { simulator, localnet } from 'genlayer-js/chains';
import { createGenlayerClient } from 'genlayer-js';

const customBradbury = {
  ...simulator,
  id: 4221,
  rpcUrls: {
    default: { http: ['https://rpc-bradbury.genlayer.com'] }
  }
};

const client = createGenlayerClient({
  chain: customBradbury,
  endpoint: 'https://rpc-bradbury.genlayer.com',
});

console.log('Calling simulateWriteContract...');
try {
  const result = await client.simulateWriteContract({
    address: '0x5d5d5b3a451a6dfbf8bc4f63578711e71b438855',
    functionName: 'check_football',
    args: ['Arsenal', 'Chelsea', '2025-04-20'],
  });
  console.log('Result:', result);
} catch (e) {
  console.error('Error:', e.message);
  console.error('Cause:', e.cause);
}
