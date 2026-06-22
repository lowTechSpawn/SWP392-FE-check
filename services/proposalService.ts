import { seriesService } from "@/services/seriesService";
import type { Proposal, ProposalStatus } from "@/types/proposal";

export const mapSeriesToProposal = (s: any): Proposal => {
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
    submittedAt: s.submittedAt || s.createdAt || new Date().toISOString(),
    coverImageUrl: s.coverImageUrl,
    rawStatus: rawStatus,
    sourceZipFileAssetId: s.sourceZipFileAssetId || null,
  };
};

export const proposalService = {
  getProposals: async (): Promise<Proposal[]> => {
    const list = await seriesService.listSeries();
    return list.map(mapSeriesToProposal);
  },

  getProposalsByMangaka: async (mangakaId: string): Promise<Proposal[]> => {
    const list = await seriesService.listSeries();
    const mapped = list.map(mapSeriesToProposal);
    return mapped.filter((p) => p.mangakaId.toLowerCase() === mangakaId.toLowerCase());
  },

  getProposalById: async (id: string): Promise<Proposal | undefined> => {
    try {
      const s = await seriesService.getSeriesById(id);
      return mapSeriesToProposal(s);
    } catch {
      return undefined;
    }
  },

  /**
   * BR-19: Returns true if the mangaka already has a proposal in Pending Review or Under Review.
   */
  hasPendingProposal: async (mangakaId: string): Promise<boolean> => {
    const list = await proposalService.getProposals();
    return list.some(
      (p) =>
        p.mangakaId.toLowerCase() === mangakaId.toLowerCase() &&
        (p.status === 'Pending Review' || p.status === 'Under Review')
    );
  },

  /**
   * BR-17: Returns true if there is already an Active series with this exact title.
   */
  isTitleDuplicate: async (title: string, excludeId?: string): Promise<boolean> => {
    const list = await proposalService.getProposals();
    return list.some(
      (p) =>
        p.title.toLowerCase() === title.toLowerCase() &&
        p.status === 'Approved' &&
        p.id !== excludeId
    );
  },

  /**
   * Save a new proposal as Draft.
   */
  saveDraft: async (
    data: Omit<Proposal, 'id' | 'status' | 'createdAt'>,
  ): Promise<Proposal> => {
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
  },

  /**
   * Submit a proposal for review.
   */
  submitProposal: async (
    data: Omit<Proposal, 'id' | 'status' | 'createdAt' | 'submittedAt'>,
  ): Promise<Proposal> => {
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
  },

  /**
   * Update an existing draft proposal.
   */
  updateDraft: async (
    id: string,
    updates: Partial<Omit<Proposal, 'id' | 'mangakaId' | 'createdAt'>>,
    submit: boolean = false
  ): Promise<Proposal | null> => {
    const existing = await proposalService.getProposalById(id);
    if (!existing || existing.status !== 'Draft') return null;
    const updatedData = { ...existing, ...updates };
    const res = await seriesService.updateProposal(id, {
      title: updatedData.title,
      genre: updatedData.genre ? updatedData.genre.split(', ').filter(Boolean) : [],
      publicationType: updatedData.publicationType,
      synopsis: updatedData.synopsis,
      sampleFileUrl: updatedData.sampleFileUrl,
      coverImageUrl: updatedData.coverImageUrl,
      mangakaId: updatedData.mangakaId,
      sourceZipFileAssetId: updatedData.sourceZipFileAssetId,
      status: submit ? 'PendingReview' : 'Draft'
    });
    return mapSeriesToProposal(res);
  },

  /**
   * Delete a Draft proposal.
   */
  deleteDraft: async (id: string): Promise<boolean> => {
    try {
      await seriesService.updateProposalStatus(id, 'Cancelled');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Update the status of any proposal.
   */
  updateProposalStatus: async (
    id: string,
    status: ProposalStatus | 'Active',
    rejectReason?: string
  ): Promise<boolean> => {
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
};
