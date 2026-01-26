import fetch from 'node-fetch';

async function testKnowledgeSubmission() {
    const data = {
        title: 'テスト知恵',
        content: 'これはテストの知恵です。' + new Date().toISOString(),
        tags: ['テスト'],
        createdBy: 'test_user_id'
    };

    console.log('Submitting test knowledge...');
    const res = await fetch('http://localhost:3000/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log('Submission result:', result);

    if (result.success) {
        console.log('Successfully submitted with ID:', result.id);
    } else {
        console.error('Submission failed:', result.error);
    }
}

testKnowledgeSubmission();
