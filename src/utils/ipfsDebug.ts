/**
 * Simple IPFS debugging utility without Helia dependencies
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const pinataJWT = import.meta.env.VITE_PINATA_JWT;

    if (!pinataJWT) {
      console.error('❌ Pinata JWT not configured');
      return false;
    }

    // Test Pinata connection with a simple API call
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pinata connection successful:', data.message);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Pinata authentication failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Pinata connection:', error);
    return false;
  }
}

export async function createTestBlob(): Promise<Blob> {
  return new Blob(['Test IPFS content'], { type: 'text/plain' });
}