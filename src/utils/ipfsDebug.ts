/**
 * Simple IPFS debugging utility without Helia dependencies
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.error('❌ Pinata credentials not configured');
      return false;
    }

    // Test Pinata connection with a simple API call
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pinata connection successful:', data.message);
      return true;
    } else {
      console.error('❌ Pinata authentication failed:', response.status);
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