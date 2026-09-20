import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_FILES = [
  path.join(ROOT_DIR, 'frontend', 'public', 'data', 'leetcode_company_data.json'),
  path.join(ROOT_DIR, 'dist', 'data', 'leetcode_company_data.json'),
];

async function fetchAllLeetCodeTags() {
  console.log('[ENRICH] Fetching official LeetCode problemset and topic tags...');
  const totalExpected = 4200;
  const batchSize = 100;
  const tagMap = new Map(); // idStr -> Array<string>

  const skips = [];
  for (let s = 0; s < totalExpected; s += batchSize) {
    skips.push(s);
  }

  // Fetch in concurrent chunks of 6 batches
  const concurrency = 6;
  for (let i = 0; i < skips.length; i += concurrency) {
    const chunk = skips.slice(i, i + concurrency);
    const promises = chunk.map(async (skip) => {
      try {
        const res = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
              problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                total: totalNum
                questions: data {
                  frontendQuestionId: questionFrontendId
                  title
                  topicTags {
                    name
                  }
                }
              }
            }`,
            variables: { categorySlug: '', skip, limit: batchSize, filters: {} },
          }),
        });

        if (!res.ok) {
          console.warn(`[ENRICH] Batch skip=${skip} failed with HTTP ${res.status}`);
          return [];
        }

        const json = await res.json();
        return json?.data?.problemsetQuestionList?.questions || [];
      } catch (err) {
        console.warn(`[ENRICH] Error fetching skip=${skip}:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    for (const batch of results) {
      for (const q of batch) {
        if (q && q.frontendQuestionId) {
          const tags = (q.topicTags || []).map((t) => t.name).filter(Boolean);
          tagMap.set(String(q.frontendQuestionId), tags);
        }
      }
    }
    console.log(`[ENRICH] Collected official tags for ${tagMap.size} questions so far...`);
  }

  return tagMap;
}

async function main() {
  const tagMap = await fetchAllLeetCodeTags();
  console.log(`[ENRICH] Successfully retrieved official tags for ${tagMap.size} LeetCode problems.`);

  for (const filePath of TARGET_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`[ENRICH] Skipping non-existent path: ${filePath}`);
      continue;
    }

    console.log(`[ENRICH] Updating dataset at ${filePath}...`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    let enrichedCount = 0;
    let fallbackCount = 0;
    const topicStats = {};

    for (const q of data.questions) {
      const qIdStr = String(q.id);
      const officialTags = tagMap.get(qIdStr);

      if (officialTags && officialTags.length > 0) {
        q.topics = officialTags;
        enrichedCount++;
      } else {
        // Fallback: keep existing topics if not found in LeetCode active index
        fallbackCount++;
      }

      for (const t of q.topics) {
        topicStats[t] = (topicStats[t] || 0) + 1;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[ENRICH] Done ${filePath}: ${enrichedCount} enriched with official tags, ${fallbackCount} preserved.`);
    
    // Log sample of major topic distributions
    console.log('[ENRICH] Top 15 topic counts in updated dataset:');
    const sortedStats = Object.entries(topicStats).sort((a, b) => b[1] - a[1]);
    console.table(sortedStats.slice(0, 15).map(([topic, count]) => ({ topic, count })));
  }

  // Also save a standalone mapping in src/data/official_tags.json for direct frontend reference
  const tagObj = Object.fromEntries(tagMap);
  const mappingPath = path.join(ROOT_DIR, 'frontend', 'src', 'data', 'official_tags.json');
  fs.writeFileSync(mappingPath, JSON.stringify(tagObj), 'utf8');
  console.log(`[ENRICH] Saved official tags mapping to ${mappingPath}`);
}

main().catch((err) => {
  console.error('[ENRICH] Fatal error:', err);
  process.exit(1);
});
