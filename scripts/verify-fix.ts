import fetch from 'node-fetch';

async function verifyFix() {
    const timestamp = new Date().toISOString();
    const submissionData = {
        title: 'Fix Verification 知恵',
        content: 'Verification content ' + timestamp,
        tags: ['verification'],
        createdBy: 'suzuki_01'
    };

    console.log('1. Submitting knowledge...');
    const subRes = await fetch('http://localhost:3000/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    });

    const subResult = await subRes.json();
    console.log('Submission result:', subResult);

    if (!subResult.success) {
        console.error('Submission failed:', subResult.details || subResult.error);
        return;
    }

    console.log('2. Searching for the new knowledge...');
    // Add a small delay to ensure DB consistency (though it should be immediate)
    await new Promise(r => setTimeout(r, 1000));

    const searchRes = await fetch(`http://localhost:3000/api/search?q=Verification`, {
        cache: 'no-store'
    });
    const searchResult = await searchRes.json();

    console.log(`Found ${searchResult.results?.length || 0} results.`);
    const found = searchResult.results?.find((r: any) => r.content.includes(timestamp));

    if (found) {
        console.log('SUCCESS! New knowledge was found in search results.');
        console.log('Found Item:', found);
    } else {
        console.error('FAILURE: New knowledge was NOT found in search results.');
        // console.log('Top result:', searchResult.results?.[0]);
    }
}

verifyFix();
