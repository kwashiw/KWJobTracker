
export enum JobStatus {
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFER = 'Offer',
  REJECTED = 'Rejected'
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
}

export interface CareerStats {
  totalApplied: number;
  totalRejections: number; // Includes historical deleted rejections
  totalOffers: number;
  successRate: number;
}
