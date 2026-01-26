import { SupabaseKnowledgeRepository } from '../src/infrastructure/SupabaseKnowledgeRepository';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugSaveKnowledge() {
    const repo = new SupabaseKnowledgeRepository();

    try {
        console.log('Testing saveKnowledge directly...');
        const id = await repo.saveKnowledge({
            title: 'Debug 知恵',
            content: 'これはデバッグ用の知恵です。' + new Date().toISOString(),
            tags: ['debug'],
            createdBy: 'debug_user',
            trustTier: 3,
            sourceType: 'user_submission',
            visibility: 'public',
            approvalStatus: 'pending',
            helpfulnessCount: 0,
            category: 'Testing'
        });
        console.log('Success! Saved with ID:', id);
    } catch (error: any) {
        console.error('Failed to save knowledge:');
        console.error(error);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
        if (error.message) console.error('Message:', error.message);
    }
}

debugSaveKnowledge();
