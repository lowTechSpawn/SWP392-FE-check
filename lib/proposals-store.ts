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
  try {
    const list = await seriesService.listSeries();
    const mapped = list.map(mapSeriesToProposal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mangaflow_proposals', JSON.stringify(mapped));
    }
    return mapped;
  } catch (error) {
    console.warn("Backend listSeries failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        return JSON.parse(raw);
      }
    }
    return [];
  }
}

export async function getProposalsByMangaka(mangakaId: string): Promise<Proposal[]> {
  try {
    const list = await seriesService.listSeries();
    const mapped = list.map(mapSeriesToProposal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mangaflow_proposals', JSON.stringify(mapped));
    }
    return mapped.filter((p) => p.mangakaId.toLowerCase() === mangakaId.toLowerCase());
  } catch (error) {
    console.warn("Backend listSeries for Mangaka failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        const list = JSON.parse(raw) as Proposal[];
        return list.filter((p) => p.mangakaId.toLowerCase() === mangakaId.toLowerCase());
      }
    }
    return [];
  }
}

export async function getProposalById(id: string): Promise<Proposal | undefined> {
  try {
    const s = await seriesService.getSeriesById(id);
    return mapSeriesToProposal(s);
  } catch {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        const list = JSON.parse(raw) as Proposal[];
        return list.find(p => p.id === id);
      }
    }
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
  try {
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
  } catch (error) {
    console.warn("Backend saveDraft failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      const list = raw ? JSON.parse(raw) : [];
      const newProposal: Proposal = {
        id: `PR${String(list.length + 1).padStart(2, '0')}`,
        title: data.title,
        genre: data.genre,
        publicationType: data.publicationType as any,
        synopsis: data.synopsis,
        sampleFileUrl: data.sampleFileUrl,
        mangakaId: data.mangakaId,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        coverImageUrl: data.coverImageUrl,
        sourceZipFileAssetId: data.sourceZipFileAssetId,
      };
      list.push(newProposal);
      localStorage.setItem('mangaflow_proposals', JSON.stringify(list));
      return newProposal;
    }
    throw error;
  }
}

/**
 * Submit a proposal for review.
 */
export async function submitProposal(
  data: Omit<Proposal, 'id' | 'status' | 'createdAt' | 'submittedAt'>,
): Promise<Proposal> {
  try {
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
  } catch (error) {
    console.warn("Backend submitProposal failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      const list = raw ? JSON.parse(raw) : [];
      const newProposal: Proposal = {
        id: `PR${String(list.length + 1).padStart(2, '0')}`,
        title: data.title,
        genre: data.genre,
        publicationType: data.publicationType as any,
        synopsis: data.synopsis,
        sampleFileUrl: data.sampleFileUrl,
        mangakaId: data.mangakaId,
        status: 'Pending Review',
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        coverImageUrl: data.coverImageUrl,
        sourceZipFileAssetId: data.sourceZipFileAssetId,
      };
      list.push(newProposal);
      localStorage.setItem('mangaflow_proposals', JSON.stringify(list));
      return newProposal;
    }
    throw error;
  }
}

/**
 * Update an existing draft proposal.
 */
export async function updateDraft(
  id: string,
  updates: Partial<Omit<Proposal, 'id' | 'mangakaId' | 'createdAt'>>,
): Promise<Proposal | null> {
  try {
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
  } catch (error) {
    console.warn("Backend updateDraft failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        const list = JSON.parse(raw) as Proposal[];
        const idx = list.findIndex(p => p.id === id);
        if (idx !== -1) {
          const updated = { ...list[idx], ...updates };
          list[idx] = updated;
          localStorage.setItem('mangaflow_proposals', JSON.stringify(list));
          return updated;
        }
      }
    }
    return null;
  }
}

/**
 * Delete a Draft proposal.
 */
export async function deleteDraft(id: string): Promise<boolean> {
  try {
    await seriesService.updateProposalStatus(id, 'Cancelled');
    return true;
  } catch {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        const list = JSON.parse(raw) as Proposal[];
        const idx = list.findIndex(p => p.id === id);
        if (idx !== -1) {
          list.splice(idx, 1);
          localStorage.setItem('mangaflow_proposals', JSON.stringify(list));
          return true;
        }
      }
    }
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
  } catch (error) {
    console.warn("Backend updateProposalStatus failed, using offline fallback...", error);
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('mangaflow_proposals');
      if (raw) {
        const list = JSON.parse(raw) as Proposal[];
        const idx = list.findIndex(p => p.id === id);
        if (idx !== -1) {
          list[idx].status = status as ProposalStatus;
          list[idx].rawStatus = status === 'Approved' ? 'Active' : (status === 'Rejected' ? 'Rejected' : status);
          localStorage.setItem('mangaflow_proposals', JSON.stringify(list));
          return true;
        }
      }
    }
    return false;
  }
}
