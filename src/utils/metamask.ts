/**
 * Checks if MetaMask is installed and accessible
 */
export const isMetaMaskInstalled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if ethereum object exists
  if (typeof window.ethereum === 'undefined') {
    return false;
  }
  
  // Check if it's specifically MetaMask
  // Some wallets inject ethereum object but aren't MetaMask
  return window.ethereum.isMetaMask === true;
};

/**
 * Checks if any Ethereum wallet is available (not just MetaMask)
 */
export const isEthereumWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined';
};

/**
 * Gets the name of the detected wallet
 */
export const getWalletName = (): string => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return 'None';
  }
  
  if (window.ethereum.isMetaMask) return 'MetaMask';
  if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
  if (window.ethereum.isWalletConnect) return 'WalletConnect';
  
  return 'Unknown Wallet';
};

/**
 * Opens MetaMask download page if not installed
 */
export const promptMetaMaskInstall = (): void => {
  window.open('https://metamask.io/download/', '_blank');
};