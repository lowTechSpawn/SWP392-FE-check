export type ProposalStatus = 'Draft' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Active';

export interface Proposal {
  id: string;
  title: string;
  genre: string;
  publicationType: 'Weekly' | 'Monthly' | 'One-Shot';
  synopsis: string;
  sampleFileUrl: string;
  mangakaId: string;
  status: ProposalStatus;
  createdAt: string;
  submittedAt?: string;
  coverImageUrl?: string;
  rawStatus?: string;
  sourceZipFileAssetId?: string | null;
}
