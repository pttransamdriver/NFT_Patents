/**
 * IPFS / Pinata debugging utilities.
 *
 * SECURITY NOTE: The Pinata JWT must never be exposed to the browser.
 * All IPFS operations go through the backend proxy (backend/routes/ipfs.js).
 * This utility therefore tests connectivity by hitting the backend health
 * endpoint rather than calling Pinata directly.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Test whether the backend's Pinata proxy is reachable and configured.
 * Uses the /api/health endpoint — no secrets ever leave the server.
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      console.error('❌ Backend health check failed:', response.status);
      return false;
    }
    const data = await response.json();
    const pinataOk = data?.services?.pinata?.enabled === true;
    if (!pinataOk) {
      console.error('❌ Backend reports Pinata is not configured');
    }
    return pinataOk;
  } catch (error) {
    console.error('❌ Error reaching backend health endpoint:', error);
    return false;
  }
}

export async function createTestBlob(): Promise<Blob> {
  return new Blob(['Test IPFS content'], { type: 'text/plain' });
}