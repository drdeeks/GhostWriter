import { NextResponse } from 'next/server';

export async function GET() {
  const aiConfig = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.9'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '700', 10),
    timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '10000', 10),
    systemPromptAppend: process.env.AI_STORY_SYSTEM_PROMPT_APPEND || '',
  };

  return NextResponse.json(aiConfig);
}
