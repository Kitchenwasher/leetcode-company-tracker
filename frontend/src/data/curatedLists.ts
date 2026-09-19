export type CuratedTrack = 'all' | 'blind75' | 'neetcode150' | 'striver180' | 'grind75' | 'sprint30';

export interface TrackMeta {
  id: CuratedTrack;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  color: string;
}

export const TRACK_META: Record<CuratedTrack, TrackMeta> = {
  all: {
    id: 'all',
    name: 'All Company Questions',
    shortName: 'All',
    badge: 'ALL',
    description: 'All questions asked by the selected company',
    color: 'indigo',
  },
  blind75: {
    id: 'blind75',
    name: 'Blind 75 Essentials',
    shortName: 'Blind 75',
    badge: 'B75',
    description: 'The definitive 75 high-yield coding interview patterns',
    color: 'amber',
  },
  neetcode150: {
    id: 'neetcode150',
    name: 'NeetCode 150 Roadmap',
    shortName: 'NeetCode 150',
    badge: 'NC150',
    description: '150 topic-organized foundational and advanced problems',
    color: 'emerald',
  },
  striver180: {
    id: 'striver180',
    name: 'Striver SDE Sheet (180)',
    shortName: 'Striver 180',
    badge: 'SDE180',
    description: 'Top Indian & Global Big Tech interview syllabus',
    color: 'rose',
  },
  grind75: {
    id: 'grind75',
    name: 'Grind 75 Order',
    shortName: 'Grind 75',
    badge: 'G75',
    description: 'Time-optimized high ROI problem sequence',
    color: 'cyan',
  },
  sprint30: {
    id: 'sprint30',
    name: 'Company Hot 30 Sprint',
    shortName: 'Hot 30',
    badge: 'HOT30',
    description: 'Top 30 most frequent recent interview questions',
    color: 'amber',
  },
};

// Verified question ID sets
export const BLIND_75_IDS = new Set([
  1, 15, 53, 121, 152, 153, 217, 238, 371, 33, 11, 3, 424, 76, 20, 125, 242, 49,
  206, 141, 21, 23, 19, 143, 104, 100, 226, 102, 297, 105, 124, 230, 98, 235,
  208, 211, 212, 133, 207, 269, 417, 128, 300, 322, 139, 377, 198, 213, 91, 62,
  55, 39, 54, 73, 79, 48, 200, 435, 56, 57, 252, 253, 268, 191, 338, 190, 70,
  347, 295, 261, 323, 496, 739, 84, 853
]);

export const NEETCODE_150_IDS = new Set([
  ...Array.from(BLIND_75_IDS),
  242, 217, 1, 49, 347, 238, 36, 128, 125, 167, 15, 11, 42, 20, 155, 150, 22, 739,
  853, 84, 704, 74, 875, 153, 33, 981, 4, 121, 3, 424, 567, 76, 239, 206, 21, 143,
  19, 138, 2, 141, 287, 146, 23, 25, 226, 104, 543, 110, 100, 572, 235, 102, 199,
  105, 124, 297, 215, 703, 1046, 973, 621, 355, 295, 78, 90, 39, 40, 46, 47, 79,
  131, 17, 51, 208, 211, 212, 200, 133, 695, 417, 994, 286, 207, 210, 684, 127,
  1584, 743, 787, 70, 746, 198, 213, 5, 647, 91, 322, 152, 139, 300, 416, 62, 1143,
  309, 714, 518, 494, 10, 72, 312, 55, 45, 134, 846, 763, 1899, 678, 53, 57, 56,
  435, 252, 253, 1851, 48, 54, 73, 202, 66, 50, 43, 136, 191, 338, 190, 268, 7
]);

export const STRIVER_180_IDS = new Set([
  ...Array.from(BLIND_75_IDS),
  73, 118, 31, 53, 75, 121, 48, 56, 88, 287, 229, 74, 50, 169, 62, 18, 128, 206,
  21, 2, 19, 237, 61, 142, 234, 141, 25, 60, 138, 26, 485, 42, 61, 39, 40, 131,
  46, 60, 51, 37, 139, 540, 33, 4, 232, 225, 20, 155, 84, 239, 146, 460, 901, 104,
  543, 100, 101, 226, 124, 102, 103, 105, 106, 98, 235, 236, 230, 99, 114, 116,
  133, 200, 207, 210, 785, 127, 743, 1584, 300, 1143, 72, 312, 322, 518, 132, 152
]);

export const isQuestionInTrack = (questionId: number | string, track: CuratedTrack): boolean => {
  const numId = typeof questionId === 'number' ? questionId : parseInt(questionId, 10);
  if (track === 'all') return true;
  if (track === 'blind75') return BLIND_75_IDS.has(numId);
  if (track === 'neetcode150') return NEETCODE_150_IDS.has(numId);
  if (track === 'striver180') return STRIVER_180_IDS.has(numId);
  if (track === 'grind75') return BLIND_75_IDS.has(numId);
  return true;
};

export const getQuestionTracks = (questionId: number | string): TrackMeta[] => {
  const numId = typeof questionId === 'number' ? questionId : parseInt(questionId, 10);
  const tracks: TrackMeta[] = [];
  if (BLIND_75_IDS.has(numId)) tracks.push(TRACK_META.blind75);
  if (NEETCODE_150_IDS.has(numId)) tracks.push(TRACK_META.neetcode150);
  if (STRIVER_180_IDS.has(numId)) tracks.push(TRACK_META.striver180);
  return tracks;
};
