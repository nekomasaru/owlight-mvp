
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
    try {
        const docRef = doc(db, 'settings', 'system_prompt');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return NextResponse.json({ content: docSnap.data().content });
        } else {
            // Return null or a specific flag if not found, to let UI show default
            return NextResponse.json({ content: null });
        }
    } catch (error) {
        console.error('Error fetching system prompt:', error);
        return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const docRef = doc(db, 'settings', 'system_prompt');
        await setDoc(docRef, {
            content,
            updatedAt: serverTimestamp(),
            version: 1 // Simple versioning for now, can increment in future
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving system prompt:', error);
        return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
    }
}
