import { render, screen } from '@testing-library/react';
import { NFTCollection } from '@/components/nft-collection';

describe('NFTCollection', () => {
  it('should show connect wallet message when no address', () => {
    render(<NFTCollection address={undefined} />);
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/View your Ghost Writer NFT collection/i)).toBeInTheDocument();
  });

  it('should show collection header when address provided', () => {
    render(<NFTCollection address="0x1234567890123456789012345678901234567890" />);
    expect(screen.getByText(/Your NFT Collection/i)).toBeInTheDocument();
  });

  it('should show NFT count', () => {
    render(<NFTCollection address="0x1234567890123456789012345678901234567890" />);
    expect(screen.getByText(/0 NFTs owned/i)).toBeInTheDocument();
  });

  it('should show filter buttons', () => {
    render(<NFTCollection address="0x1234567890123456789012345678901234567890" />);
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hidden/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revealed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creator/i })).toBeInTheDocument();
  });

  it('should show no NFTs message when count is zero', () => {
    render(<NFTCollection address="0x1234567890123456789012345678901234567890" />);
    expect(screen.getByText(/No NFTs yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Contribute to stories to mint your first NFT/i)).toBeInTheDocument();
  });

  it('should show all tab content by default', () => {
    render(<NFTCollection address="0x1234567890123456789012345678901234567890" />);
    expect(screen.getByText(/No NFTs yet/i)).toBeInTheDocument();
  });
});
