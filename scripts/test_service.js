import { AiSolutionService } from '../backend/dist/services/aiSolutionService.js';

async function main() {
  console.log('Testing AiSolutionService.generateSolution...');
  const start = Date.now();
  const res = await AiSolutionService.generateSolution({
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    topics: ['Array', 'Hash Table']
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Success in ${elapsed}s! Pattern: "${res.corePattern}", Approaches: ${res.approaches.length}`);
  res.approaches.forEach((app, i) => {
    console.log(`Approach ${i + 1}: ${app.name} [${app.tag}] - C++: ${Boolean(app.code?.cpp)}, Python: ${Boolean(app.code?.python)}, Java: ${Boolean(app.code?.java)}`);
  });
}

main().catch(console.error);
