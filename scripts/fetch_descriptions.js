import fs from 'fs';
import path from 'path';

const DESCRIPTIONS_DIR = './frontend/public/descriptions';
const DATA_FILE = './frontend/public/data/leetcode_company_data.json';

if (!fs.existsSync(DESCRIPTIONS_DIR)) {
  fs.mkdirSync(DESCRIPTIONS_DIR, { recursive: true });
}

function getTitleSlug(q) {
  if (q.url) {
    const parts = q.url.replace(/\/+$/, '').split('/');
    const last = parts[parts.length - 1];
    if (last && last !== 'problems') return last;
  }
  return q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchQuestionContent(slug) {
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
      variables: { titleSlug: slug },
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data?.data?.question;
}

async function main() {
  console.log('Loading questions from', DATA_FILE);
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const questions = data.questions || [];
  console.log(`Total questions in database: ${questions.length}`);

  // Fetch descriptions for Google top questions first, or all questions that have solutions
  const top100File = './scripts/google_top100.json';
  let targetQuestions = [];
  if (fs.existsSync(top100File)) {
    const top100 = JSON.parse(fs.readFileSync(top100File, 'utf8'));
    const topSet = new Set(top100.map(t => Number(t.id)));
    targetQuestions = questions.filter(q => topSet.has(Number(q.id)));
  }
  if (targetQuestions.length === 0) {
    targetQuestions = questions.slice(0, 150);
  }

  console.log(`Fetching descriptions for ${targetQuestions.length} questions...`);

  let fetched = 0;
  let skipped = 0;

  // Process in batches of 4
  const BATCH_SIZE = 4;
  for (let i = 0; i < targetQuestions.length; i += BATCH_SIZE) {
    const batch = targetQuestions.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (q) => {
        const filePath = path.join(DESCRIPTIONS_DIR, `${q.id}.json`);
        if (fs.existsSync(filePath)) {
          skipped++;
          return;
        }

        const slug = getTitleSlug(q);
        try {
          const detail = await fetchQuestionContent(slug);
          if (detail && detail.content) {
            const payload = {
              id: Number(q.id),
              title: q.title,
              titleSlug: slug,
              difficulty: q.difficulty,
              content: detail.content,
              exampleTestcases: detail.exampleTestcaseList || [],
              topicTags: detail.topicTags?.map(t => t.name) || q.topics || [],
            };
            fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
            fetched++;
            console.log(`✓ [${q.id}] ${q.title} saved (${detail.content.length} chars)`);
          } else {
            console.warn(`⚠ [${q.id}] ${q.title} (slug: ${slug}) returned empty content`);
          }
        } catch (err) {
          console.error(`✗ [${q.id}] ${q.title} failed:`, err.message);
        }
      })
    );
    // Small delay between batches to respect rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nFinished! Fetched: ${fetched}, Skipped (already had): ${skipped}`);
}

main().catch(console.error);
