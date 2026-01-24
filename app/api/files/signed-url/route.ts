import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const BUCKET_NAME = "owlight";

// Generate a signed URL for direct file access
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("name");

        if (!fileName) {
            return NextResponse.json({ error: "File name is required" }, { status: 400 });
        }

        const auth = new GoogleAuth({
            keyFilename: './gcp-key.json',
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const accessToken = tokenResponse.token;

        if (!accessToken) throw new Error("Failed to get access token");

        // Generate signed URL using GCS API
        const signedUrlEndpoint = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}`;

        // For now, we'll use a simple authenticated URL
        // In production, you'd want to generate a proper signed URL with expiration
        const directUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}?alt=media`;

        // Return a redirect or the URL
        return NextResponse.json({
            url: directUrl,
            // Include token for client-side authenticated access if needed
            accessToken: accessToken
        });

    } catch (error) {
        console.error("Signed URL generation error:", error);
        return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }
}
