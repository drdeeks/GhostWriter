import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service'; // Import aiService

/**
 * AI-powered word moderation using OpenAI
 * Checks if a word is inappropriate, profane, or violates content guidelines
 */
export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const moderationResult = await aiService.moderateWord(word);

    if (!moderationResult.isAppropriate) {
      return NextResponse.json({
        isProfane: true,
        reason: moderationResult.suggestion || 'Word flagged by moderation',
        categories: moderationResult.categories,
      });
    }

    return NextResponse.json({
      isProfane: false,
      reason: 'Word approved',
    });

  } catch (error: any) {
    console.error('Word moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

