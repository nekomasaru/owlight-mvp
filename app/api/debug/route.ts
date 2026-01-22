import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
