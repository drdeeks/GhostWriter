
import { NextResponse } from 'next/server';
import Filter from 'bad-words';

const filter = new Filter();

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const isProfane = filter.isProfane(word);

    return NextResponse.json({ isProfane });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
