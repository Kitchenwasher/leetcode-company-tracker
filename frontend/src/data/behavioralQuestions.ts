export interface BehavioralQuestion {
  id: string;
  company: 'Google' | 'Meta' | 'Amazon' | 'Microsoft' | 'Apple' | 'General';
  category: 'Leadership' | 'Conflict Resolution' | 'Ambiguity & Problem Solving' | 'Innovation & Growth' | 'Collaboration';
  title: string;
  prompt: string;
  frameworkGuide: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  interviewerTips: string[];
}

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: 'beh-amz-1',
    company: 'Amazon',
    category: 'Leadership',
    title: 'Customer Obsession & Bias for Action',
    prompt: 'Tell me about a time when you had to make an important decision with incomplete data to satisfy a customer or user deadline.',
    frameworkGuide: {
      situation: 'Set the context: what customer problem or production deadline was at stake? What data was missing?',
      task: 'What was your specific responsibility, and what were the risks of waiting vs acting quickly?',
      action: 'What calculated risks did you take? How did you test your hypotheses and rally your team?',
      result: 'Quantify the outcome: did the feature ship? What was the customer reception? What did you learn?',
    },
    interviewerTips: [
      'Focus on Amazon Leadership Principles: "Bias for Action" and "Customer Obsession".',
      'Explain how you distinguished two-way doors (reversible) from one-way doors (irreversible).',
      'Cite metrics where possible (% latency drop, revenue impact, downtime prevented).',
    ],
  },
  {
    id: 'beh-amz-2',
    company: 'Amazon',
    category: 'Conflict Resolution',
    title: 'Have Backbone; Disagree and Commit',
    prompt: 'Describe a situation where you strongly disagreed with a team lead or colleague on a technical architecture direction. How did you handle it?',
    frameworkGuide: {
      situation: 'Describe the technical debate (e.g. monolith vs microservices, SQL vs NoSQL, sync vs async).',
      task: 'Explain why you believed the proposed approach carried critical risks.',
      action: 'How did you present data-driven arguments respectfully? Once the final decision was made, how did you commit 100%?',
      result: 'What was the eventual delivery result? How did your relationship with the colleague evolve?',
    },
    interviewerTips: [
      'Show genuine respect for differing opinions without being a pushover.',
      'Demonstrate that once decided, you executed wholeheartedly with zero passive-aggressive resistance.',
    ],
  },
  {
    id: 'beh-goog-1',
    company: 'Google',
    category: 'Ambiguity & Problem Solving',
    title: 'Navigating Ambiguity (Googliness)',
    prompt: 'Tell me about a time you took on a vague, loosely defined problem and turned it into an actionable technical roadmap.',
    frameworkGuide: {
      situation: 'What was the ambiguous mandate (e.g. "make the search pipeline faster", "investigate telemetry anomalies")?',
      task: 'How did you define the problem boundary, success criteria, and key performance indicators?',
      action: 'Describe your discovery process, stakeholder interviews, prototyping, and milestone breakdown.',
      result: 'How did the project deliver value? Did it become a standard pattern for the organization?',
    },
    interviewerTips: [
      'Highlight intellectual curiosity, proactivity, and data-driven scoping.',
      'Google values engineers who thrive when no one hands them a ready-made specification.',
    ],
  },
  {
    id: 'beh-goog-2',
    company: 'Google',
    category: 'Innovation & Growth',
    title: 'Learning from Technical Failure',
    prompt: 'Walk me through a project or production incident that did not go as planned. What went wrong and what changed permanently as a result?',
    frameworkGuide: {
      situation: 'Describe the incident or failure objectively without blaming teammates or third-party tools.',
      task: 'What was your role in triage, root cause analysis (5 Whys), and post-mortem creation?',
      action: 'What blameless post-mortem steps did you execute? What guardrails/tests did you build?',
      result: 'Share the long-term impact: zero regressions, automated rollback pipeline, or team training.',
    },
    interviewerTips: [
      'Demonstrate high psychological safety and blameless engineering culture.',
      'Emphasize systemic architectural fixes over "we just need to be more careful".',
    ],
  },
  {
    id: 'beh-meta-1',
    company: 'Meta',
    category: 'Leadership',
    title: 'Move Fast with Focus',
    prompt: 'Give an example of when you had to rapidly build and ship a Minimum Viable Product (MVP) to test a hypothesis. How did you balance speed and quality?',
    frameworkGuide: {
      situation: 'What was the high-priority business opportunity or user need that demanded immediate action?',
      task: 'What trade-offs were required between architectural purity and time-to-market?',
      action: 'What features did you deliberately cut? How did you ensure test coverage on the critical path?',
      result: 'Did the experiment validate the product hypothesis? How did you pay down tech debt afterwards?',
    },
    interviewerTips: [
      'Show deep appreciation for user feedback loops and iteration speed.',
      'Acknowledge tech debt management to prove you build sustainably.',
    ],
  },
  {
    id: 'beh-meta-2',
    company: 'Meta',
    category: 'Collaboration',
    title: 'Cross-Functional Collaboration',
    prompt: 'Describe a project where you had to align multiple stakeholders (Product Managers, Designers, Data Scientists, or other engineering teams) with competing priorities.',
    frameworkGuide: {
      situation: 'Describe the cross-functional team composition and where the priority conflicts arose.',
      task: 'What common objective did you establish to bring everyone onto the same page?',
      action: 'How did you communicate technical constraints in plain business language and resolve bottlenecks?',
      result: 'What did the team deliver together, and how did it establish smoother cross-team relations?',
    },
    interviewerTips: [
      'Show empathy for non-technical stakeholders (Product, Design, Operations).',
      'Demonstrate proactive transparency via dashboards, written RFCs, and demo days.',
    ],
  },
  {
    id: 'beh-msft-1',
    company: 'Microsoft',
    category: 'Innovation & Growth',
    title: 'Growth Mindset & Upskilling',
    prompt: 'Tell me about a time you had to quickly master an unfamiliar tech stack, domain, or language to deliver a mission-critical initiative.',
    frameworkGuide: {
      situation: 'What was the new domain or technology, and why was it necessary for the business?',
      task: 'What were the time constraints and the steepness of the learning curve?',
      action: 'How did you structure your learning, build proofs of concept, and seek mentorship?',
      result: 'What did you ship, and how did you share your learnings with the broader engineering team?',
    },
    interviewerTips: [
      'Satya Nadella’s core Microsoft tenet: "Learn-it-all, not Know-it-all".',
      'Focus on curiosity, humility, and willingness to step outside your comfort zone.',
    ],
  },
  {
    id: 'beh-appl-1',
    company: 'Apple',
    category: 'Ambiguity & Problem Solving',
    title: 'Relentless Attention to Detail & Craftsmanship',
    prompt: 'Describe a project where extreme polish, performance, or edge-case handling made the decisive difference in user experience.',
    frameworkGuide: {
      situation: 'What was the user experience or subsystem where good enough was not acceptable?',
      task: 'What specific micro-interactions, memory footprint, or battery/rendering issues did you target?',
      action: 'What profiling tools did you employ? How did you optimize algorithms down to microsecond/frame budgets?',
      result: 'What was the quantifiable performance leap (e.g. 60fps/120fps lock, 40% memory reduction)?',
    },
    interviewerTips: [
      'Emphasize respect for user craft, simplicity, and hardware/software synergy.',
      'Show meticulousness in benchmarking and edge case handling.',
    ],
  },
];

export function getBehavioralQuestions(company?: string): BehavioralQuestion[] {
  if (!company || company.toLowerCase() === 'all') return BEHAVIORAL_QUESTIONS;
  const normalized = company.toLowerCase();
  const matched = BEHAVIORAL_QUESTIONS.filter((q) => q.company.toLowerCase() === normalized);
  return matched.length > 0 ? matched : BEHAVIORAL_QUESTIONS;
}
