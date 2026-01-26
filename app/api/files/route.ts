import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { container } from '@/src/di/container';

const BUCKET_NAME = "owlight"; // Hardcoded for MVP

// Helper to get Google Auth Token
async function getAccessToken() {
    const auth = new GoogleAuth({
        keyFilename: './gcp-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
}

// GET: GCSバケットからファイル一覧を取得
export async function GET() {
    try {
        const token = await getAccessToken();
        if (!token) throw new Error("Failed to get access token");

        const listUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o`;
        const res = await fetch(listUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error('[FilesAPI] Failed to list GCS objects:', await res.text());
            throw new Error('Failed to list GCS objects');
        }

        const data = await res.json();
        const items = data.items || [];

        const files = items.map((item: any) => ({
            name: item.name,
            displayName: item.name,
            uri: `gs://${BUCKET_NAME}/${item.name}`,
            mimeType: item.contentType || 'application/octet-stream',
            sizeBytes: item.size,
            createTime: item.timeCreated,
            updateTime: item.updated,
            state: 'ACTIVE' // GCSにある＝利用可能とする
        }));

        return NextResponse.json({ files });
    } catch (error) {
        console.error("List files error:", error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}

// POST: GCSへアップロード & Vertex AI Searchへインポート
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;

        // 1. Upload to GCS
        const token = await getAccessToken();
        if (!token) throw new Error("Failed to get access token");

        console.log(`[UploadAPI] Uploading ${fileName} to GCS bucket ${BUCKET_NAME}...`);

        const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;
        const gcsResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': file.type || 'application/octet-stream'
            },
            body: buffer
        });

        if (!gcsResponse.ok) {
            const errText = await gcsResponse.text();
            throw new Error(`GCS Upload failed: ${errText}`);
        }

        const gcsData = await gcsResponse.json();
        console.log(`[UploadAPI] GCS Upload Success: ${gcsData.name}`);

        // 2. Trigger Vertex AI Search Import
        const gcsUri = `gs://${BUCKET_NAME}/${fileName}`;
        console.log(`[UploadAPI] Triggering RAG Import for: ${gcsUri}`);

        // Use the DI container to get the service (ensure type compatibility in your mind)
        const ragService = container.ragService as any;
        // We cast to any because the interface might not officially have importDocuments yet if we didn't update the interface definition,
        // but the implementation class DOES have it.

        if (ragService.importDocuments) {
            await ragService.importDocuments(gcsUri);
        } else {
            console.warn("[UploadAPI] ragService does not support importDocuments method.");
        }

        return NextResponse.json({
            success: true,
            file: { name: fileName, uri: gcsUri },
            message: "Upload and Import Triggered Successfully"
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload file" }, { status: 500 });
    }
}

// DELETE: GCS及びVertex AI Searchからファイルを削除
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const vertexName = searchParams.get("vertexName"); // Full Vertex document name
        const fileName = searchParams.get("fileName");       // Actual GCS filename

        if (!vertexName || !fileName) {
            return NextResponse.json({ error: "Both vertexName and fileName are required" }, { status: 400 });
        }

        const token = await getAccessToken();
        if (!token) throw new Error("No token");

        console.log(`[DeleteAPI] Deleting - Vertex: ${vertexName}, GCS: ${fileName}`);

        // 1. Delete from Vertex AI Search
        const ragService = container.ragService as any;
        if (ragService.deleteDocument) {
            try {
                await ragService.deleteDocument(vertexName);
                console.log(`[DeleteAPI] Deleted from Vertex AI: ${vertexName}`);
            } catch (vertexError) {
                console.error(`[DeleteAPI] Vertex delete error (continuing):`, vertexError);
                // Continue to GCS deletion even if Vertex fails
            }
        }

        // 2. Delete from GCS using the actual filename
        const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}`;
        const gcsResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!gcsResponse.ok) {
            const errorText = await gcsResponse.text();
            console.error(`[DeleteAPI] GCS delete error: ${errorText}`);
            throw new Error(`GCS delete failed: ${errorText}`);
        } else {
            console.log(`[DeleteAPI] Deleted from GCS: ${fileName}`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
