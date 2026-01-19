import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

/**
 * Enhanced AI-powered story generation API
 * Features: Caching, fallbacks, performance monitoring, error handling
 */
export async function POST(request: Request) {
  const startTime = performance.now();
  
  try {
    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const { category } = body;

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { 
          error: 'Invalid category',
          code: 'INVALID_CATEGORY',
          details: 'Category must be a non-empty string'
        }, 
        { status: 400 }
      );
    }

    // Generate story using enhanced AI service
    const result = await aiService.generateStory(category);
    const processingTime = performance.now() - startTime;

    // Add performance metrics to response
    return NextResponse.json({
      ...result,
      meta: {
        processingTime: Math.round(processingTime),
        timestamp: new Date().toISOString(),
        version: '2.0',
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Processing-Time': processingTime.toString(),
      }
    });

  } catch (error: any) {
    const processingTime = performance.now() - startTime;
    
    console.error('Story generation error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    // Return structured error response
    return NextResponse.json(
      { 
        error: 'Story generation failed',
        code: 'GENERATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        meta: {
          processingTime: Math.round(processingTime),
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
