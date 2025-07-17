/**
 * Checks if MetaMask is installed and accessible
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask === true;
};

/**
 * Opens MetaMask download page if not installed
 */
export const promptMetaMaskInstall = (): void => {
  window.open('https://metamask.io/download/', '_blank');
};