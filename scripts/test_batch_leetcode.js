async function testBatch() {
  const slugs = ['two-sum', 'add-two-numbers', 'longest-substring-without-repeating-characters', 'median-of-two-sorted-arrays', 'n-queens'];
  for (const s of slugs) {
    const start = Date.now();
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `query q($s: String!) { question(titleSlug: $s) { title content difficulty } }`,
        variables: { s }
      })
    });
    const data = await res.json();
    const elapsed = Date.now() - start;
    console.log(`${s} (${elapsed}ms): ${data.data?.question?.title} - length ${data.data?.question?.content?.length}`);
  }
}

testBatch();
