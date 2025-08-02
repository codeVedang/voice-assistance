// app/api/chat/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    let reply = "I am a simple voice assistant. Try asking me about the capital of India.";

    const lowerCasePrompt = prompt.toLowerCase();

    if (lowerCasePrompt.includes('capital') && lowerCasePrompt.includes('india')) {
      reply = "The capital of India is New Delhi.";
    }

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ error: 'Failed in the mock API route' }, { status: 500 });
  }
}