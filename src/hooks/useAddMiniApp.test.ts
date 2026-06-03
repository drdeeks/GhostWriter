import { renderHook } from '@testing-library/react';
import { useAddMiniApp } from './useAddMiniApp';

jest.mock('@/components/FarcasterWrapper', () => ({
  useFarcaster: jest.fn(),
}));

jest.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    actions: {
      addMiniApp: jest.fn(),
    },
  },
}));

describe('useAddMiniApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return addMiniApp function', () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: false });

    const { result } = renderHook(() => useAddMiniApp());
    expect(typeof result.current.addMiniApp).toBe('function');
  });

  it('should not call sdk when not in mini app context', async () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: false });

    const { sdk } = require('@farcaster/miniapp-sdk');
    const { result } = renderHook(() => useAddMiniApp());
    await result.current.addMiniApp();
    expect(sdk.actions.addMiniApp).not.toHaveBeenCalled();
  });

  it('should call sdk.addMiniApp when in mini app context', async () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: true });

    const { sdk } = require('@farcaster/miniapp-sdk');
    sdk.actions.addMiniApp.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAddMiniApp());
    await result.current.addMiniApp();
    expect(sdk.actions.addMiniApp).toHaveBeenCalled();
  });

  it('should throw RejectedByUser error', async () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: true });

    const { sdk } = require('@farcaster/miniapp-sdk');
    sdk.actions.addMiniApp.mockRejectedValue(new Error('RejectedByUser'));

    const { result } = renderHook(() => useAddMiniApp());
    await expect(result.current.addMiniApp()).rejects.toThrow('RejectedByUser');
  });

  it('should throw InvalidDomainManifestJson error', async () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: true });

    const { sdk } = require('@farcaster/miniapp-sdk');
    sdk.actions.addMiniApp.mockRejectedValue(new Error('InvalidDomainManifestJson'));

    const { result } = renderHook(() => useAddMiniApp());
    await expect(result.current.addMiniApp()).rejects.toThrow('InvalidDomainManifestJson');
  });

  it('should throw generic error', async () => {
    const { useFarcaster } = require('@/components/FarcasterWrapper');
    useFarcaster.mockReturnValue({ isMiniApp: true });

    const { sdk } = require('@farcaster/miniapp-sdk');
    sdk.actions.addMiniApp.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAddMiniApp());
    await expect(result.current.addMiniApp()).rejects.toThrow('Network error');
  });
});
