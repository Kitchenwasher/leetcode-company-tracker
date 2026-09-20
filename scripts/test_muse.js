import { ENV } from '../backend/dist/config/env.js';

async function main() {
  console.log('Testing Meta Muse API with endpoint:', ENV.MUSE_API_URL, 'model:', ENV.MUSE_MODEL);
  
  const systemPrompt = `You are a Principal Software Engineer at Google and Meta.
Your task is to write a production-grade LeetCode solution editorial for the problem.
You MUST output a valid raw JSON object. Do NOT include markdown text outside the JSON object.

Format strictly as:
{
  "corePattern": "Algorithmic Pattern Name",
  "interviewTips": ["tip 1", "tip 2"],
  "approaches": [
    {
      "id": "brute-force",
      "name": "Approach 1: Brute Force",
      "tag": "Brute Force",
      "intuition": "first principles intuition...",
      "theory": "theoretical reasoning...",
      "code": {
        "python": "class Solution:\\n    def ...",
        "cpp": "class Solution {\\npublic:\\n    ...\\n};",
        "java": "class Solution {\\n    public ...\\n}"
      },
      "timeComplexity": { "complexity": "O(N^2)", "explanation": "Nested loops." },
      "spaceComplexity": { "complexity": "O(1)", "explanation": "Constant extra memory." },
      "dryRunExample": { "input": "...", "steps": ["step 1"], "output": "..." },
      "edgeCases": ["case 1"]
    },
    {
      "id": "optimal",
      "name": "Approach 2: One-pass Hash Map",
      "tag": "Optimal",
      "intuition": "...",
      "theory": "...",
      "code": {
        "python": "class Solution:\\n    def ...",
        "cpp": "class Solution {\\npublic:\\n    ...\\n};",
        "java": "class Solution {\\n    public ...\\n}"
      },
      "timeComplexity": { "complexity": "O(N)", "explanation": "Single traversal with hash table lookups." },
      "spaceComplexity": { "complexity": "O(N)", "explanation": "Map storing elements." },
      "dryRunExample": { "input": "...", "steps": ["step 1"], "output": "..." },
      "edgeCases": ["case 1"]
    }
  ]
}`;

  const userPrompt = `Generate a multi-approach editorial for Problem #1: "Two Sum" (Easy) [Topics: Array, Hash Table]. Provide working Python 3, C++, and Java code for each approach.`;

  const endpoint = `${ENV.MUSE_API_URL.replace(/\/+$/, '')}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.MUSE_API_KEY}`,
    },
    body: JSON.stringify({
      model: ENV.MUSE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 12000,
      temperature: 0.2,
    }),
  });

  const status = response.status;
  const json = await response.json();
  console.log('Status:', status);
  console.log('Choices 0:', JSON.stringify(json.choices?.[0], null, 2));
  console.log('Usage:', JSON.stringify(json.usage, null, 2));
  if (!json.choices) {
    console.log('Full response:', JSON.stringify(json, null, 2));
  }
}

main().catch(console.error);
