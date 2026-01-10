/**
 * Compatibility shim for wagmi/experimental
 * In wagmi v3, experimental features were moved to the main package.
 * This shim re-exports them to maintain compatibility with @coinbase/onchainkit.
 */
export {
  useSendCalls,
  type UseSendCallsParameters,
  type UseSendCallsReturnType,
  useCallsStatus,
  type UseCallsStatusParameters,
  type UseCallsStatusReturnType,
  useCapabilities,
  type UseCapabilitiesParameters,
  type UseCapabilitiesReturnType,
  useShowCallsStatus,
  type UseShowCallsStatusParameters,
  type UseShowCallsStatusReturnType,
} from 'wagmi';
