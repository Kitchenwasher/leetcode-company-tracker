async function testLeetCode() {
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            content
            difficulty
            exampleTestcaseList
            topicTags { name }
          }
        }`,
        variables: { titleSlug: 'two-sum' }
      })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Title:', data.data?.question?.title);
    console.log('Content preview:', data.data?.question?.content?.slice(0, 300));
  } catch (err) {
    console.error('Error fetching LeetCode GraphQL:', err);
  }
}

testLeetCode();
