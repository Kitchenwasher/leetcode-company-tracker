import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { AiSolutionService } from '../backend/dist/services/aiSolutionService.js';

const prisma = new PrismaClient();
const SOLUTIONS_DIR = './frontend/public/solutions';
const TOP100_FILE = './scripts/google_top100.json';
const PROGRESS_FILE = './scripts/google_top100_progress.json';

async function main() {
  if (!fs.existsSync(TOP100_FILE)) {
    console.error('Google top 100 file not found:', TOP100_FILE);
    return;
  }

  const questions = JSON.parse(fs.readFileSync(TOP100_FILE, 'utf8'));
  console.log(`Loaded ${questions.length} Google top questions.`);

  let progress = { completed: [], failed: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }

  const completedSet = new Set(progress.completed);

  // Filter questions that need generation
  const toProcess = questions.filter(q => {
    const file = path.join(SOLUTIONS_DIR, `${q.id}.json`);
    if (fs.existsSync(file)) {
      try {
        const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
        const hasMultiLang = existing.approaches?.some(a => a.code?.python || a.code?.java);
        if (hasMultiLang && existing.approaches?.length >= 2) {
          completedSet.add(q.id);
          return false;
        }
      } catch {}
    }
    return !completedSet.has(q.id);
  });

  console.log(`Questions already completed: ${completedSet.size}`);
  console.log(`Questions remaining to generate: ${toProcess.length}`);

  // Process sequentially to be gentle on API rate limits
  let count = 0;
  for (const q of toProcess) {
    count++;
    console.log(`\n[${count}/${toProcess.length}] Generating editorial for #${q.id}: "${q.title}" (${q.difficulty})...`);
    const start = Date.now();

    try {
      const solution = await AiSolutionService.generateSolution({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        topics: q.topics || [],
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ✓ Generated in ${elapsed}s! Pattern: "${solution.corePattern}", Approaches: ${solution.approaches.length}`);

      // 1. Save static JSON
      const jsonPath = path.join(SOLUTIONS_DIR, `${q.id}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(solution, null, 2), 'utf8');

      // 2. Cache in Neon PostgreSQL
      try {
        await prisma.solution.upsert({
          where: { questionId: q.id },
          update: {
            corePattern: solution.corePattern,
            interviewTips: JSON.stringify(solution.interviewTips),
            approaches: JSON.stringify(solution.approaches),
          },
          create: {
            questionId: q.id,
            corePattern: solution.corePattern,
            interviewTips: JSON.stringify(solution.interviewTips),
            approaches: JSON.stringify(solution.approaches),
          },
        });
        console.log(`  ✓ Cached permanently in Neon PostgreSQL.`);
      } catch (dbErr) {
        console.warn(`  ⚠ Database cache warning (static JSON saved):`, dbErr.message);
      }

      completedSet.add(q.id);
      progress.completed = Array.from(completedSet);
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

      // Small delay between requests to be polite to API
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ✗ Failed #${q.id}:`, err.message);
      progress.failed.push({ id: q.id, error: err.message, time: new Date().toISOString() });
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      // Wait 3s before next
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Update index.json
  const allFiles = fs.readdirSync(SOLUTIONS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const manifest = [];
  for (const f of allFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SOLUTIONS_DIR, f), 'utf8'));
      manifest.push({
        questionId: data.questionId || parseInt(f.replace('.json', ''), 10),
        title: data.title,
        difficulty: data.difficulty,
        corePattern: data.corePattern,
        approachCount: data.approaches?.length || 0,
        hasSolution: true,
      });
    } catch {}
  }
  fs.writeFileSync(path.join(SOLUTIONS_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nAll done! Updated ${SOLUTIONS_DIR}/index.json with ${manifest.length} solutions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
