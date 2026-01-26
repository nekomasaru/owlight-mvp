import fetch from 'node-fetch';

async function testKnowledgeSubmission() {
    const data = {
        title: 'テスト知恵 (Suzuki)',
        content: 'これは Suzuki によるテストの知恵です。' + new Date().toISOString(),
        tags: ['テスト'],
        createdBy: 'suzuki_01'
    };

    console.log('Submitting test knowledge as suzuki_01...');
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
        console.error('Submission failed:', result.details || result.error);
    }
}

testKnowledgeSubmission();
