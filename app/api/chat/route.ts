// app/api/chat/route.ts

import { NextResponse } from 'next/server';

// This is the final, most robust way to call the OpenRouter API.
// It uses a direct 'fetch' call, which avoids potential issues with the OpenAI library.
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // We will check for either environment variable to be more robust,
    // as we have used both names during our debugging process.
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error("OpenRouter or OpenAI API key is missing from .env.local file.");
        return NextResponse.json({ error: 'Server configuration error: API key not found.' }, { status: 500 });
    }

    // We construct the API call manually for maximum reliability.
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
        "X-Title": "AI Voice Assistant",      // Required by OpenRouter
      },
      body: JSON.stringify({
        // --- THIS IS THE FIX ---
        // We are switching to a different, highly reliable free model.
        model: "mistralai/mistral-7b-instruct:free",
        // --- END OF FIX ---
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API Error Response:', errorBody);
        return NextResponse.json({ error: `Failed to get response from OpenRouter. Status: ${response.status}` }, { status: 500 });
    }

    const completion = await response.json();
    const reply = completion.choices[0].message.content;
    
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred in the API route.' }, { status: 500 });
  }
}
