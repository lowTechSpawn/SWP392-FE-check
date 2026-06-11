/**
 * Backend-integrated proposals store.
 * Calls seriesService APIs asynchronously.
 */

import { seriesService } from "@/services/seriesService";

export type ProposalStatus = 'Draft' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Active';

export interface Proposal {
  id: string;
  title: string;
  genre: string;
  publicationType: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly' | 'One-Shot';
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

const mapSeriesToProposal = (s: any): Proposal => {
  let status: ProposalStatus = 'Draft';
  const rawStatus = s.status || '';

  if (rawStatus === 'Active' || rawStatus === 'Approved') {
    status = 'Approved';
  } else if (rawStatus === 'Cancelled' || rawStatus === 'Rejected') {
    status = 'Rejected';
  } else if (rawStatus === 'UnderReview' || rawStatus === 'Under Review' || rawStatus === 'PendingReview' || rawStatus === 'Proposed') {
    status = 'Pending Review';
  } else if (rawStatus === 'BoardVoting') {
    status = 'Under Review';
  } else {
    status = 'Draft';
  }

  return {
    id: s.id,
    title: s.title,
    genre: s.genre ? s.genre.join(', ') : '',
    publicationType: s.type as any,
    synopsis: s.description || '',
    sampleFileUrl: s.sampleFileUrl || '',
    mangakaId: s.mangakaId || '',
    status: status,
    createdAt: s.createdAt || new Date().toISOString(),
    submittedAt: s.createdAt,
    coverImageUrl: s.coverImageUrl,
    rawStatus: rawStatus,
    sourceZipFileAssetId: s.sourceZipFileAssetId || null,
  };
};

export async function getProposals(): Promise<Proposal[]> {
  const list = await seriesService.listSeries();
  return list.map(mapSeriesToProposal);
}

export async function getProposalsByMangaka(mangakaId: string): Promise<Proposal[]> {
  const list = await seriesService.listSeries();
  const mapped = list.map(mapSeriesToProposal);
  return mapped.filter((p) => p.mangakaId.toLowerCase() === mangakaId.toLowerCase());
}

export async function getProposalById(id: string): Promise<Proposal | undefined> {
  try {
    const s = await seriesService.getSeriesById(id);
    return mapSeriesToProposal(s);
  } catch {
    return undefined;
  }
}

/**
 * BR-19: Returns true if the mangaka already has a proposal in Pending Review or Under Review.
 */
export async function hasPendingProposal(mangakaId: string): Promise<boolean> {
  const list = await getProposals();
  return list.some(
    (p) =>
      p.mangakaId.toLowerCase() === mangakaId.toLowerCase() &&
      (p.status === 'Pending Review' || p.status === 'Under Review')
  );
}

/**
 * BR-17: Returns true if there is already an Active series with this exact title.
 */
export async function isTitleDuplicate(title: string, excludeId?: string): Promise<boolean> {
  const list = await getProposals();
  return list.some(
    (p) =>
      p.title.toLowerCase() === title.toLowerCase() &&
      p.status === 'Approved' &&
      p.id !== excludeId
  );
}

/**
 * Save a new proposal as Draft.
 */
export async function saveDraft(
  data: Omit<Proposal, 'id' | 'status' | 'createdAt'>,
): Promise<Proposal> {
  const res = await seriesService.submitProposal({
    title: data.title,
    genre: data.genre,
    publicationType: data.publicationType,
    synopsis: data.synopsis,
    sampleFileUrl: data.sampleFileUrl,
    coverImageUrl: data.coverImageUrl,
    mangakaId: data.mangakaId,
    sourceZipFileAssetId: data.sourceZipFileAssetId,
    status: 'Draft'
  });
  return mapSeriesToProposal(res);
}

/**
 * Submit a proposal for review.
 */
export async function submitProposal(
  data: Omit<Proposal, 'id' | 'status' | 'createdAt' | 'submittedAt'>,
): Promise<Proposal> {
  const res = await seriesService.submitProposal({
    title: data.title,
    genre: data.genre,
    publicationType: data.publicationType,
    synopsis: data.synopsis,
    sampleFileUrl: data.sampleFileUrl,
    coverImageUrl: data.coverImageUrl,
    mangakaId: data.mangakaId,
    sourceZipFileAssetId: data.sourceZipFileAssetId,
    status: 'PendingReview'
  });
  return mapSeriesToProposal(res);
}

/**
 * Update an existing draft proposal.
 */
export async function updateDraft(
  id: string,
  updates: Partial<Omit<Proposal, 'id' | 'mangakaId' | 'createdAt'>>,
): Promise<Proposal | null> {
  const existing = await getProposalById(id);
  if (!existing || existing.status !== 'Draft') return null;
  const updatedData = { ...existing, ...updates };
  const res = await seriesService.submitProposal({
    title: updatedData.title,
    genre: updatedData.genre,
    publicationType: updatedData.publicationType,
    synopsis: updatedData.synopsis,
    sampleFileUrl: updatedData.sampleFileUrl,
    coverImageUrl: updatedData.coverImageUrl,
    mangakaId: updatedData.mangakaId,
    sourceZipFileAssetId: updatedData.sourceZipFileAssetId,
    status: 'Draft'
  });
  return mapSeriesToProposal(res);
}

/**
 * Delete a Draft proposal.
 */
export async function deleteDraft(id: string): Promise<boolean> {
  try {
    await seriesService.updateProposalStatus(id, 'Cancelled');
    return true;
  } catch {
    return false;
  }
}

/**
 * Update the status of any proposal.
 */
export async function updateProposalStatus(
  id: string,
  status: ProposalStatus | 'Active',
  rejectReason?: string
): Promise<boolean> {
  try {
    // Map to backend status
    let backendStatus = 'Draft';
    if (status === 'Approved') backendStatus = 'Active';
    else if (status === 'Active') backendStatus = 'Active';
    else if (status === 'Rejected') backendStatus = 'Rejected';
    else if (status === 'Pending Review') backendStatus = 'PendingReview';
    else if (status === 'Under Review') backendStatus = 'UnderReview';
    
    await seriesService.updateProposalStatus(id, backendStatus, rejectReason);
    return true;
  } catch {
    return false;
  }
}
