export interface ComplexityInfo {
  complexity: string; // e.g. "O(N)" or "O(N log N)"
  explanation: string; // e.g. "Iterating over array of N elements"
}

export interface SolutionApproach {
  id: string; // e.g. "brute-force", "hash-map", "two-pointers"
  name: string; // e.g. "Approach 1: Brute Force (Nested Loops)"
  tag: 'Brute Force' | 'Better' | 'Optimal' | 'Alternative';
  intuition: string; // Step-by-step thinking of how this idea develops
  theory: string; // Algorithmic theory, invariants, proofs
  cppCode: string; // Clean C++ code with includes and line comments (backwards compatibility)
  code?: {
    cpp?: string;
    python?: string;
    java?: string;
    typescript?: string;
    javascript?: string;
  };
  timeComplexity: ComplexityInfo;
  spaceComplexity: ComplexityInfo;
  dryRunExample?: {
    input: string;
    steps: string[];
    output: string;
  };
  edgeCases: string[]; // C++ traps, overflow, boundary conditions
}

export interface QuestionSolution {
  questionId: number | string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  corePattern: string; // e.g. "Hash Map Lookup", "Two Pointers", "Sliding Window"
  approaches: SolutionApproach[];
  interviewTips: string[]; // Advice on how to present in an interview
}

export interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface QuestionDescription {
  id: number | string;
  title: string;
  titleSlug?: string;
  difficulty: string;
  content: string;
  exampleTestcases?: string[];
  topicTags?: string[];
  codeSnippets?: CodeSnippet[];
}

