import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const apiKey = process.env.GEMINI_API_KEY || "";
const fileManager = new GoogleAIFileManager(apiKey);

// 一時保存デレクトリ
const UPLOAD_DIR = path.join(process.cwd(), "tmp/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// GET: ファイル一覧の取得
export async function GET() {
    try {
        const response = await fileManager.listFiles();
        return NextResponse.json({ files: response.files });
    } catch (error) {
        console.error("List files error:", error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}

// POST: ファイルのアップロード
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let finalBuffer = buffer;
        let mimeType = file.type || "text/plain";
        let fileName = file.name;

        // MIMEタイプまたは拡張子で判定してテキスト抽出
        const isDocx = file.name.endsWith('.docx') || mimeType.includes('wordprocessingml');
        const isXlsx = file.name.endsWith('.xlsx') || mimeType.includes('spreadsheetml');

        if (isDocx) {
            try {
                const result = await mammoth.extractRawText({ buffer: buffer });
                const textContent = result.value; // The raw text
                finalBuffer = Buffer.from(textContent, 'utf-8');
                mimeType = "text/plain";
                // Gemini上で区別しやすいように名前を変えても良いが、ユーザー体験的には元の名前が良い
                // ただし MIME=text/plain なので中身はそう扱う
            } catch (e) {
                console.error("Word processing error", e);
                throw new Error("Wordファイルの読み込みに失敗しました");
            }
        } else if (isXlsx) {
            try {
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                let textContent = "";
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    // CSVとしてテキスト化するのが手っ取り早い
                    const csv = XLSX.utils.sheet_to_csv(sheet);
                    textContent += `[Sheet: ${sheetName}]\n${csv}\n\n`;
                });
                finalBuffer = Buffer.from(textContent, 'utf-8');
                mimeType = "text/plain";
            } catch (e) {
                console.error("Excel processing error", e);
                throw new Error("Excelファイルの読み込みに失敗しました");
            }
        }

        // 一時ファイルとして保存
        const tempFilePath = path.join(UPLOAD_DIR, fileName);
        await writeFile(tempFilePath, finalBuffer);

        // Google File APIへアップロード
        const uploadResponse = await fileManager.uploadFile(tempFilePath, {
            mimeType: mimeType,
            displayName: fileName,
        });

        // 一時ファイルを削除
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({ file: uploadResponse.file });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload file" }, { status: 500 });
    }
}

// DELETE: ファイルの削除
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name"); // files/xxxx...

        if (!name) {
            return NextResponse.json({ error: "File name is required" }, { status: 400 });
        }

        await fileManager.deleteFile(name);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
