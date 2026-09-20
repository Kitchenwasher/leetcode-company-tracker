import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.solution.count();
  console.log('Current Solution table count in DB:', count);

  // Check some existing solutions to see if any are trash stubs
  const sampleSolutions = await prisma.solution.findMany({
    take: 5,
    include: { question: true }
  });
  for (const s of sampleSolutions) {
    console.log(`- Solution #${s.questionId} (${s.question?.title}): pattern=${s.corePattern}`);
  }

  // Find top questions for Google
  const googleQuestions = await prisma.questionCompany.findMany({
    where: { companyId: 'google' },
    include: { question: true },
  });

  console.log(`Total Google questions in DB: ${googleQuestions.length}`);

  // Sort by frequency
  const sorted = googleQuestions.map(g => {
    let freqVal = 0;
    if (g.allFreq) {
      const match = g.allFreq.match(/(\d+(\.\d+)?)/);
      if (match) freqVal = parseFloat(match[1]);
    }
    return {
      id: g.questionId,
      title: g.question.title,
      difficulty: g.question.difficulty,
      topics: g.question.topics,
      freq: g.allFreq,
      freqVal,
    };
  }).sort((a, b) => b.freqVal - a.freqVal);

  console.log('Top 10 Google questions:');
  console.log(sorted.slice(0, 10).map(q => `#${q.id} ${q.title} (${q.difficulty}, freq: ${q.freq})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
