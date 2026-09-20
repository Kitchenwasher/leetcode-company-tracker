import fs from 'fs';
import path from 'path';

const SOLUTIONS_DIR = './frontend/public/solutions';

const files = fs.readdirSync(SOLUTIONS_DIR);
console.log(`Total files in ${SOLUTIONS_DIR}: ${files.length}`);

let deletedCount = 0;
let keptCount = 0;
const keptManifest = [];

for (const file of files) {
  if (!file.endsWith('.json') || file === 'index.json') continue;

  const fullPath = path.join(SOLUTIONS_DIR, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const isTrash =
      content.includes('/* window condition violated */') ||
      content.includes('solveNaive') ||
      content.includes('Direct simulation logic') ||
      content.includes('while (/* window condition violated */ false)') ||
      content.includes('return countMap.size();');

    if (isTrash) {
      fs.unlinkSync(fullPath);
      deletedCount++;
    } else {
      const parsed = JSON.parse(content);
      keptCount++;
      keptManifest.push({
        questionId: parsed.questionId || parseInt(file.replace('.json', ''), 10),
        title: parsed.title,
        difficulty: parsed.difficulty,
        corePattern: parsed.corePattern,
        approachCount: parsed.approaches?.length || 0,
        hasSolution: true,
      });
      console.log(`KEPT valid solution: ${file} (${parsed.title})`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

// Write clean index.json
fs.writeFileSync(path.join(SOLUTIONS_DIR, 'index.json'), JSON.stringify(keptManifest, null, 2));
console.log(`\nPurge Complete!`);
console.log(`Deleted trash solutions: ${deletedCount}`);
console.log(`Kept authentic solutions: ${keptCount}`);
console.log(`Updated index.json with ${keptManifest.length} entries.`);
