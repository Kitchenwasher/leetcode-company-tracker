import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const prisma = new PrismaClient();
const SOLUTIONS_DIR = './frontend/public/solutions';
const DATA_FILE = './frontend/public/data/leetcode_company_data.json';

async function main() {
  console.log('Connecting to Neon PostgreSQL to sync questions and solutions...');

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const questionsMap = new Map();
  (rawData.questions || []).forEach(q => questionsMap.set(Number(q.id), q));

  const files = fs.readdirSync(SOLUTIONS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Found ${files.length} solution files to sync to Neon DB.`);

  let syncedCount = 0;
  for (const f of files) {
    const qid = parseInt(f.replace('.json', ''), 10);
    if (isNaN(qid)) continue;

    try {
      const sol = JSON.parse(fs.readFileSync(path.join(SOLUTIONS_DIR, f), 'utf8'));
      const qMeta = questionsMap.get(qid) || {
        title: sol.title || `Problem #${qid}`,
        difficulty: sol.difficulty || 'Medium',
        topics: [],
        acceptance: '50.0%',
      };

      // 1. Upsert Question first (satisfies foreign key constraint)
      await prisma.question.upsert({
        where: { id: qid },
        update: {
          title: qMeta.title || sol.title,
          difficulty: qMeta.difficulty || sol.difficulty,
          topics: JSON.stringify(qMeta.topics || []),
        },
        create: {
          id: qid,
          title: qMeta.title || sol.title,
          difficulty: qMeta.difficulty || sol.difficulty,
          acceptance: qMeta.acceptance || '50.0%',
          url: `https://leetcode.com/problems/${(qMeta.title || sol.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
          topics: JSON.stringify(qMeta.topics || []),
        },
      });

      // 2. Upsert Solution
      await prisma.solution.upsert({
        where: { questionId: qid },
        update: {
          corePattern: sol.corePattern || 'Algorithmic Pattern',
          interviewTips: JSON.stringify(sol.interviewTips || []),
          approaches: JSON.stringify(sol.approaches || []),
        },
        create: {
          questionId: qid,
          corePattern: sol.corePattern || 'Algorithmic Pattern',
          interviewTips: JSON.stringify(sol.interviewTips || []),
          approaches: JSON.stringify(sol.approaches || []),
        },
      });

      syncedCount++;
    } catch (err) {
      console.error(`Error syncing #${qid}:`, err.message);
    }
  }

  console.log(`\nSync complete! Successfully synced ${syncedCount}/${files.length} solutions to Neon PostgreSQL.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
