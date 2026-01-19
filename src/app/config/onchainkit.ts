// OnchainKit configuration with fallbacks for deployment
export const ONCHAINKIT_PROJECT_ID = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID || '';
export const ONCHAINKIT_API_KEY = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '';

// Check if OnchainKit is properly configured
export const isOnchainKitConfigured = () => {
  return Boolean(ONCHAINKIT_PROJECT_ID && ONCHAINKIT_API_KEY);
};
