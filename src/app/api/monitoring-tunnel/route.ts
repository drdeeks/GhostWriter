"use server"

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extract project ID from DSN
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      throw new Error('Sentry DSN not configured');
    }
    
    const projectId = dsn.split('/').pop();
    if (!projectId) {
      throw new Error('Invalid Sentry DSN format');
    }
    
    // Directly proxy to Sentry
    const result = await fetch(`https://sentry.io/api/${projectId}/envelope/`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SENTRY_DSN?.split('/').pop()}`
      }
    });
    
    const responseData = await result.json();
    return new Response(JSON.stringify(responseData), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sentry tunnel error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}