import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./frontend/public/data/leetcode_company_data.json', 'utf8'));
const questions = data.questions || [];
console.log('Total questions in json:', questions.length);
const googleQs = questions.filter(q => q.companies && q.companies['google']);
console.log('Total Google questions:', googleQs.length);

function parseFreq(f) {
  if (!f) return 0;
  const m = String(f).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

googleQs.sort((a, b) => {
  const fa = Math.max(
    parseFreq(a.companies.google.all),
    parseFreq(a.companies.google['thirty-days']),
    parseFreq(a.companies.google['six-months'])
  );
  const fb = Math.max(
    parseFreq(b.companies.google.all),
    parseFreq(b.companies.google['thirty-days']),
    parseFreq(b.companies.google['six-months'])
  );
  if (fb !== fa) return fb - fa;
  return a.id - b.id;
});

console.log('Top 20 Google questions:');
googleQs.slice(0, 20).forEach((q, i) => {
  console.log(`${i + 1}. #${q.id}: ${q.title} (${q.difficulty}) [${(q.topics || []).slice(0, 3).join(', ')}] - Google Freq: ${q.companies.google.all || q.companies.google['thirty-days'] || 'Asked'}`);
});

// Save top 100 question ids to a JSON file for processing
const top100 = googleQs.slice(0, 100).map(q => ({
  id: q.id,
  title: q.title,
  difficulty: q.difficulty,
  topics: q.topics || [],
}));

fs.writeFileSync('./scripts/google_top100.json', JSON.stringify(top100, null, 2));
console.log(`Saved ${top100.length} questions to scripts/google_top100.json`);
