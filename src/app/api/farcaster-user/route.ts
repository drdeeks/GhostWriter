import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

/**
 * Get Farcaster user information (FID and username) from wallet address
 * This is a placeholder - in production, you'd query Farcaster's API or use a service like Neynar
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

    // Validate address format
    if (!isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    // Try to fetch Farcaster user data if API key is configured
    if (process.env.FARCASTER_API_KEY) {
      try {
        const farcasterResponse = await fetch(
          `https://api.farcaster.xyz/v2/user-by-verification?address=${address}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`,
            },
          }
        );
        
        if (farcasterResponse.ok) {
          const data = await farcasterResponse.json();
          const fid = data?.result?.user?.fid;
          const username = data?.result?.user?.username;
          const displayName = data?.result?.user?.displayName;
          
          if (fid || username) {
            return NextResponse.json(
              {
                address,
                fid: fid || null,
                username: username || null,
                displayName: displayName || null,
                note: 'Farcaster user data retrieved successfully',
              },
              {
                headers: {
                  'Cache-Control': 'no-store',
                },
              }
            );
          }
        }
      } catch (error) {
        console.warn('Failed to fetch Farcaster user info:', error);
      }
    }

    // Placeholder response - replace with actual Farcaster API call
    // For development, you can use a mock service or hardcode test values
    return NextResponse.json(
      {
        address,
        fid: null, // Will be populated when Farcaster API is integrated
        username: null, // Will be populated when Farcaster API is integrated
        displayName: null,
        note: 'Farcaster integration pending - using placeholder data',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
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
