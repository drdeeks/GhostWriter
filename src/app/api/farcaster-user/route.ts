import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

/**
 * Get Farcaster user information (FID and username) from wallet address using Neynar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;

    if (!neynarApiKey) {
      // Fallback for development if no API key
      return NextResponse.json({
        address,
        fid: null,
        username: null,
        displayName: null,
        note: 'Neynar API key missing - skipping Farcaster lookup',
      });
    }

    const farcasterResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );
    
    if (!farcasterResponse.ok) {
        throw new Error(`Neynar API error: ${farcasterResponse.statusText}`);
    }

    const data = await farcasterResponse.json();
    const user = data[address.toLowerCase()]?.[0];

    return NextResponse.json(
      {
        address,
        fid: user?.fid || null,
        username: user?.username || null,
        displayName: user?.display_name || null,
        pfp: user?.pfp_url || null,
        verified: !!user,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600', // Cache for 1 hour
        },
      }
    );

  } catch (error: any) {
    console.error('Error fetching Farcaster user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}