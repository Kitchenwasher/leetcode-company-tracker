export type PostCategory = 'interview_experience' | 'question_help' | 'general' | 'compensation' | 'all';

export interface CreatePostInput {
  title: string;
  content: string;
  category: 'interview_experience' | 'question_help' | 'general' | 'compensation';
  companyId?: string;
  questionId?: number;
  tags?: string[];
}

export interface AddCommentInput {
  content: string;
}

export interface PostResponse {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorTier: string;
  title: string;
  content: string;
  category: string;
  companyId?: string | null;
  questionId?: number | null;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  hasUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorTier: string;
  content: string;
  createdAt: string;
}
