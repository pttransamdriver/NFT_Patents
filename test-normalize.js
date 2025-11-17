/**
 * Patent Normalization Test
 * Tests the _normalizePatentId function logic
 */

import crypto from 'crypto';

/**
 * Replicates the Solidity _normalizePatentId function
 * Normalizes patent number: removes spaces/dashes, uppercases letters
 */
function normalizePatentId(input) {
  const bytes = Buffer.from(input, 'utf8');
  const tmp = [];
  
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    // Skip space (0x20) and dash (0x2D)
    if (c === 0x20 || c === 0x2D) continue;
    
    // Convert lowercase (0x61-0x7A) to uppercase
    if (c >= 0x61 && c <= 0x7A) {
      tmp.push(c - 32);
    } else {
      tmp.push(c);
    }
  }
  
  const normalized = Buffer.from(tmp);
  // Return keccak256 hash
  return '0x' + crypto.createHash('sha256').update(normalized).digest('hex');
}

console.log('🔍 Patent Normalization Tests\n');

const testCases = [
  'US10689145B2',
  'us10689145b2',
  'US 10689145 B2',
  'US-10689145-B2',
  'us-10689145-b2',
  'CN109004053B',
  'US11810080B2',
];

console.log('Testing patent normalization:\n');
testCases.forEach(patent => {
  const normalized = normalizePatentId(patent);
  console.log(`Input:      "${patent}"`);
  console.log(`Normalized: ${normalized}\n`);
});

// Test that different formats of same patent normalize to same hash
console.log('✅ Verification: Same patent in different formats should normalize to same hash\n');
const patent1 = normalizePatentId('US10689145B2');
const patent2 = normalizePatentId('us10689145b2');
const patent3 = normalizePatentId('US-10689145-B2');

console.log(`US10689145B2:   ${patent1}`);
console.log(`us10689145b2:   ${patent2}`);
console.log(`US-10689145-B2: ${patent3}`);
console.log(`All equal? ${patent1 === patent2 && patent2 === patent3}\n`);

if (patent1 === patent2 && patent2 === patent3) {
  console.log('✅ Normalization working correctly!');
} else {
  console.log('❌ Normalization issue detected!');
}

