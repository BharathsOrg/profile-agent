import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.NEXT_PUBLIC_AGENT_ID}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error('ElevenLabs API error:', response.status, body);
      return NextResponse.json(
        { error: `ElevenLabs API error ${response.status}: ${body}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('get-signed-url route error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
