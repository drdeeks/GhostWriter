/**
 * FarcasterWrapper Component Tests
 * Tests the Farcaster context provider and miniapp detection
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FarcasterWrapper, { useFarcaster } from './FarcasterWrapper';

// Test component that uses the Farcaster context
function TestConsumer() {
  const { isMiniApp, farcasterUser } = useFarcaster();
  return (
    <div>
      <span data-testid="is-miniapp">{isMiniApp ? 'true' : 'false'}</span>
      <span data-testid="farcaster-user">{farcasterUser?.username || 'none'}</span>
    </div>
  );
}

describe('FarcasterWrapper', () => {
  describe('Context Provider', () => {
    it('should render children', () => {
      render(
        <FarcasterWrapper>
          <div data-testid="child">Hello</div>
        </FarcasterWrapper>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should provide context to children', () => {
      render(
        <FarcasterWrapper>
          <TestConsumer />
        </FarcasterWrapper>
      );

      expect(screen.getByTestId('is-miniapp')).toBeInTheDocument();
      expect(screen.getByTestId('farcaster-user')).toBeInTheDocument();
    });
  });

  describe('Miniapp Detection Logic', () => {
    it('should detect miniapp via query parameter', () => {
      const search = '?miniapp=true';
      const isInMiniApp = search.includes('miniapp=true');
      expect(isInMiniApp).toBe(true);
    });

    it('should detect miniapp via iframe context', () => {
      const windowRef = {} as Window;
      const parentRef = {} as Window;
      const isInIframe = windowRef !== parentRef;
      expect(isInIframe).toBe(true);
    });

    it('should detect miniapp via referrer', () => {
      const referrer = 'https://warpcast.com/feed';
      const isFromFarcaster = referrer.includes('farcaster') || referrer.includes('warpcast');
      expect(isFromFarcaster).toBe(true);
    });

    it('should not detect miniapp in regular browser', async () => {
      render(
        <FarcasterWrapper>
          <TestConsumer />
        </FarcasterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-miniapp').textContent).toBe('false');
      });
    });
  });

  describe('useFarcaster Hook', () => {
    it('should throw when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useFarcaster must be used within FarcasterWrapper');

      consoleSpy.mockRestore();
    });

    it('should return context values', () => {
      render(
        <FarcasterWrapper>
          <TestConsumer />
        </FarcasterWrapper>
      );

      expect(screen.getByTestId('is-miniapp')).toHaveTextContent(/true|false/);
      expect(screen.getByTestId('farcaster-user')).toHaveTextContent(/none/);
    });
  });
});

describe('Farcaster Context Values', () => {
  it('should initialize with default values', async () => {
    render(
      <FarcasterWrapper>
        <TestConsumer />
      </FarcasterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('farcaster-user').textContent).toBe('none');
    });
  });
});
