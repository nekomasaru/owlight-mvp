import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const BUCKET_NAME = "owlight";

// Helper to find actual filename when extension is missing
async function findActualFileName(searchName: string, accessToken: string): Promise<string | null> {
    try {
        // List all files in bucket
        const listUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o`;
        const listResponse = await fetch(listUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!listResponse.ok) return null;

        const data = await listResponse.json();
        const files = data.items || [];

        // Try exact match first
        const exactMatch = files.find((f: any) => f.name === searchName);
        if (exactMatch) return exactMatch.name;

        // Try fuzzy match (file without extension = searchName)
        const fuzzyMatch = files.find((f: any) => {
            const nameWithoutExt = f.name.replace(/\.[^/.]+$/, ''); // Remove extension
            return nameWithoutExt === searchName;
        });

        if (fuzzyMatch) {
            console.log(`[FileProxy] Fuzzy matched: "${searchName}" -> "${fuzzyMatch.name}"`);
            return fuzzyMatch.name;
        }

        return null;
    } catch (e) {
        console.error('[FileProxy] Error in findActualFileName:', e);
        return null;
    }
}

// Proxy endpoint to serve GCS files with authentication
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let fileName = searchParams.get("name");

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

        console.log(`[FileProxy] Requested: "${fileName}"`);

        // Try to find actual filename if extension is missing
        const actualFileName = await findActualFileName(fileName, accessToken);
        if (actualFileName) {
            fileName = actualFileName;
            console.log(`[FileProxy] Using actual filename: "${fileName}"`);
        }

        // Fetch file from GCS with authentication
        const fileUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media`;

        console.log(`[FileProxy] URL: ${fileUrl}`);

        const response = await fetch(fileUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }

        // Get file content and headers
        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Encode filename for Content-Disposition (RFC 5987)
        const encodedFileName = encodeURIComponent(fileName);

        // Return file with appropriate headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename*=UTF-8''${encodedFileName}`,
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        console.error("File proxy error:", error);
        return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
    }
}
