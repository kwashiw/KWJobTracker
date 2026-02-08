export enum JobStatus {
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFER = 'Offer',
  REJECTED = 'Rejected'
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ResumeData {
  type: 'text' | 'pdf';
  content: string; // Original text or PDF DataURL
  extractedText: string; // Plain text for AI analysis
}

export interface Interview {
  id: string;
  stage: string;
  interviewer: string;
  date: string;
  mode: 'Remote' | 'In-Person';
  link?: string;
  preTodos: TodoItem[];
  postTodos: TodoItem[];
  remindersSet: boolean;
}

export interface MatchAnalysis {
  score: number;
  strengths: string[];
  gaps: string[];
}

export interface OfferEvaluation {
  rank: number;
  company: string;
  title: string;
  why: string;
  pros: string[];
  cons: string[];
}

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  description: string;
  salaryRange: string;
  status: JobStatus;
  dateAdded: string;
  dateModified: string;
  link?: string;
  interviews: Interview[];
  analysis?: MatchAnalysis;
  isArchived?: boolean;
}

export interface CareerStats {
  totalApplied: number;
  totalRejections: number;
  totalOffers: number;
  successRate: number;
}