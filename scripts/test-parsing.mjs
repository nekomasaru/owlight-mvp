
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('search_result.json', 'utf8'));

console.log("--- Testing Parsing Logic ---");

let citations = [];

// 1. Try standard citations field
if (data.answer?.citations?.length > 0) {
    console.log("Path 1: data.answer.citations found");
    citations = data.answer.citations.map((c, index) => ({
        id: `cit-${index}`,
        title: c.title || '参考資料',
        contentSnippet: c.referencedChunks?.[0]?.chunkContent || ''
    }));
}
// 2. Fallback: Try to extract from steps (search actions)
else if (data.answer?.steps) {
    console.log("Path 2: data.answer.steps found. Searching for actions...");
    const searchResults = [];
    data.answer.steps.forEach((step, sIdx) => {
        console.log(`Step ${sIdx}:`, step.state);
        step.actions?.forEach((action, aIdx) => {
            if (action.observation?.searchResults) {
                console.log(`  Action ${aIdx}: Found ${action.observation.searchResults.length} searchResults`);
                searchResults.push(...action.observation.searchResults);
            } else {
                console.log(`  Action ${aIdx}: No searchResults`);
            }
        });
    });

    citations = searchResults.map((result, index) => ({
        id: `cit-step-${index}`,
        title: result.title || '参考資料',
        contentSnippet: result.snippetInfo?.[0]?.snippet || ''
    }));
}

console.log("--- Result ---");
console.log(`Citations extracted: ${citations.length}`);
console.log(JSON.stringify(citations, null, 2));
