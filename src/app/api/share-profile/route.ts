import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const user_message = `send my profile to ${email}, include a note ''`;

  try {
    const res = await fetch("https://n8n.krishb.in/webhook/e4eb5d4d-a074-4110-9201-afac9f4016ab", {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "API_KEY": "apikey",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_message }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
