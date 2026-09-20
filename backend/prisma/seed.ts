import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('🌱 STARTING LEETTRACKER PRO DATABASE SEEDER');
  console.log('==================================================');
  console.log('🌱 LEETTRACKER PRO: Production questions & solutions seeder');


  // 2. Load Questions Dataset
  console.log('2. Loading primary questions dataset...');
  const datasetPath = path.resolve(__dirname, '../../frontend/public/data/leetcode_company_data.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`[ERROR] Primary dataset not found at ${datasetPath}`);
    return;
  }

  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const data = JSON.parse(rawData);
  const questions: any[] = data.questions || [];
  console.log(`   [INFO] Found ${questions.length} questions to index`);

  // 3. Batch insert questions in chunks
  console.log('3. Seeding questions and company frequency relations into database...');
  const CHUNK_SIZE = 150;
  let insertedQuestions = 0;
  let insertedCompanyLinks = 0;

  for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
    const chunk = questions.slice(i, i + CHUNK_SIZE);

    for (const q of chunk) {
      const qId = parseInt(String(q.id), 10);
      if (isNaN(qId)) continue;

      // Upsert Question
      await prisma.question.upsert({
        where: { id: qId },
        update: {},
        create: {
          id: qId,
          title: q.title,
          difficulty: q.difficulty,
          acceptance: q.acceptance,
          url: q.url,
          topics: JSON.stringify(q.topics || []),
          isBlind75: !!q.isBlind75,
          isNeetCode150: !!q.isNeetCode150,
          isStriver180: !!q.isStriver180,
          isGrind169: !!q.isGrind169,
        },
      });
      insertedQuestions++;

      // Upsert QuestionCompany frequencies
      const companies = q.companies || {};
      for (const [cId, freqs] of Object.entries<any>(companies)) {
        await prisma.questionCompany.upsert({
          where: {
            questionId_companyId: {
              questionId: qId,
              companyId: cId,
            },
          },
          update: {},
          create: {
            questionId: qId,
            companyId: cId,
            allFreq: freqs.all || null,
            thirtyDaysFreq: freqs['thirty-days'] || null,
            threeMonthsFreq: freqs['three-months'] || null,
            sixMonthsFreq: freqs['six-months'] || null,
            twoYearsFreq: freqs['two-years'] || null,
          },
        });
        insertedCompanyLinks++;
      }
    }

    if ((i + CHUNK_SIZE) % 600 === 0 || i + CHUNK_SIZE >= questions.length) {
      console.log(`   [PROGRESS] Indexed ${Math.min(i + CHUNK_SIZE, questions.length)} / ${questions.length} questions...`);
    }
  }

  console.log(`   [OK] Successfully indexed ${insertedQuestions} questions with ${insertedCompanyLinks} company frequencies.`);

  // 4. Seed C++ Multi-Approach Solutions
  console.log('4. Seeding multi-approach C++ solutions and theory...');
  const solutionsDir = path.resolve(__dirname, '../../frontend/public/solutions');
  if (fs.existsSync(solutionsDir)) {
    const solFiles = fs.readdirSync(solutionsDir).filter((f) => f.endsWith('.json') && f !== 'index.json');
    console.log(`   [INFO] Found ${solFiles.length} solution JSON files`);

    let seededSolutions = 0;
    for (const file of solFiles) {
      const qId = parseInt(file.replace('.json', ''), 10);
      if (isNaN(qId)) continue;

      try {
        const solContent = JSON.parse(fs.readFileSync(path.join(solutionsDir, file), 'utf-8'));
        await prisma.solution.upsert({
          where: { questionId: qId },
          update: {
            corePattern: solContent.corePattern || 'Algorithmic Pattern & Invariant',
            interviewTips: JSON.stringify(solContent.interviewTips || []),
            approaches: JSON.stringify(solContent.approaches || []),
          },
          create: {
            questionId: qId,
            corePattern: solContent.corePattern || 'Algorithmic Pattern & Invariant',
            interviewTips: JSON.stringify(solContent.interviewTips || []),
            approaches: JSON.stringify(solContent.approaches || []),
          },
        });
        seededSolutions++;
      } catch (err) {
        // Skip malformed individual file
      }
    }
    console.log(`   [OK] Seeded ${seededSolutions} multi-approach C++ solutions`);
  }

  console.log('==================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
