
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load Environment Variables IMMEDIATELY
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });
console.log(`Loaded env from: ${envPath}`);

async function fixAndSync() {
    // 2. Dynamic Import to prevent hoisting issues
    const { container } = await import('@/src/di/container');
    const { syncAndImport } = await import('@/src/lib/knowledgeSync');

    const targetId = '0ecaafee-2c0c-45c2-a90e-293a95a57c9b';
    const newTitle = '統合宛名番号の管理と特定個人情報のリスク';
    const newTags = ['特定個人情報', '統合宛名番号', 'リスク管理'];

    console.log(`Fixing Knowledge ID: ${targetId}`);

    // 3. Update Supabase
    try {
        await container.knowledgeRepository.updateKnowledge(targetId, {
            title: newTitle,
            tags: newTags
        });
        console.log(`✅ Supabase Updated: Title -> "${newTitle}"`);
    } catch (e) {
        console.error('❌ Supabase Update Failed:', e);
        process.exit(1);
    }

    // 4. Fetch updated record
    const knowledge = await container.knowledgeRepository.getKnowledge(targetId);
    if (!knowledge) {
        console.error('❌ Failed to fetch updated knowledge');
        process.exit(1);
    }

    // 5. Map fields correctly (CamelCase -> snake_case, Array -> String)
    // Knowledge entity usually has camelCase fields
    console.log('🔄 Triggering Sync & Import...');

    // Type assertion or check
    const k: any = knowledge;

    const result = await syncAndImport({
        id: k.id,
        title: k.title,
        content: k.content,
        // Map camelCase to snake_case if needed by syncAndImport
        trust_tier: k.trustTier || 3,
        source_type: k.sourceType || 'user_submission',
        category: k.category || 'general',
        // Join tags array to string
        tags: Array.isArray(k.tags) ? k.tags.join(',') : (k.tags || ''),
        // Map author/createdBy
        author_id: k.createdBy || k.authorId || '',
        created_at: k.createdAt || new Date().toISOString()
    });

    if (result.gcsSync.success) {
        console.log('✅ GCS Sync Success (Overwritten)');
    } else {
        console.error('❌ GCS Sync Failed:', result.gcsSync.error);
    }

    if (result.vertexImport.success) {
        console.log(`✅ Vertex Import Triggered: ${result.vertexImport.operationName}`);
    } else {
        console.error('❌ Vertex Import Failed:', result.vertexImport.error);
    }
}

fixAndSync();
