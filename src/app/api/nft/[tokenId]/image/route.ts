import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate SVG image for NFT based on token ID
 * This is a simplified version - in production you'd want proper image generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  try {
    const tokenIdNum = parseInt(tokenId);

    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return new NextResponse('Invalid token ID', { status: 400 });
    }

    // For now, create a simple SVG placeholder
    // In production, this would generate actual images based on NFT data
    const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2D1B69;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1A1A2A;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/>
      <text x="512" y="100" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
        GHOST WRITER
      </text>
      <text x="512" y="200" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32">
        NFT #${tokenId}
      </text>
      <circle cx="512" cy="512" r="150" fill="#D4AF37" opacity="0.3"/>
      <text x="512" y="520" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24">
        🖼️
      </text>
      <text x="512" y="600" text-anchor="middle" fill="#F59E0B" font-family="Arial, sans-serif" font-size="28" font-style="italic">
        Dynamic NFT Image
      </text>
      <text x="512" y="650" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="18">
        Story content will be displayed here
      </text>
    </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating NFT image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
