import { seriesService } from "@/services/seriesService";
import type { Proposal, ProposalStatus } from "@/types/proposal";

const SOURCE_ZIP_CACHE_KEY = 'proposal_source_zip_file_asset_ids';

const readSourceZipCache = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SOURCE_ZIP_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const getCachedSourceZipFileAssetId = (proposalId: string): string | null => {
  return readSourceZipCache()[proposalId] || null;
};

const cacheSourceZipFileAssetId = (proposalId: string, fileAssetId?: string | null) => {
  if (typeof window === 'undefined' || !proposalId || !fileAssetId) return;
  const cache = readSourceZipCache();
  cache[proposalId] = fileAssetId;
  localStorage.setItem(SOURCE_ZIP_CACHE_KEY, JSON.stringify(cache));
};
export const mapSeriesToProposal = (s: any): Proposal => {
  let status: ProposalStatus = 'Draft';
  const rawStatus = s.status || '';

  // BE status mapping:
  // UnderReview  → Mangaka submitted to Tantou Editor (awaiting Tantou review)
  // BoardVoting  → Tantou approved; now at Editorial Board for voting
  // Approved/Active → Board approved
  // Rejected/Cancelled → Rejected
  // Draft → still a draft

  if (rawStatus === 'Active') {
    status = 'Active';
  } else if (rawStatus === 'Approved') {
    status = 'Approved';
  } else if (rawStatus === 'Cancelled' || rawStatus === 'Rejected') {
    status = 'Rejected';
  } else if (rawStatus === 'UnderReview' || rawStatus === 'Under Review') {
    // Mangaka submitted → Tantou is reviewing
    status = 'Under Review';
  } else if (rawStatus === 'BoardVoting' || rawStatus === 'Board Voting') {
    // Tantou approved → Editorial Board is voting
    status = 'Board Voting';
  } else if (rawStatus === 'PendingReview' || rawStatus === 'Proposed') {
    // Legacy / fallback
    status = 'Pending Review';
  } else {
    status = 'Draft';
  }

  const proposalId = s.id;
  const sourceZipFileAssetId = s.sourceZipFileAssetId || getCachedSourceZipFileAssetId(proposalId);

  return {
    id: proposalId,
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
    sourceZipFileAssetId,
    author: s.author || 'Tác giả',
    tantouEditorName: s.tantouEditorName || undefined,
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
   * Returns true if the mangaka already has a proposal in Pending Review or Under Review.
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
   * Returns true if there is already an Active series with this exact title.
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
    const mapped = mapSeriesToProposal(res);
    cacheSourceZipFileAssetId(mapped.id, data.sourceZipFileAssetId);
    return { ...mapped, sourceZipFileAssetId: data.sourceZipFileAssetId || mapped.sourceZipFileAssetId };
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
    const mapped = mapSeriesToProposal(res);
    cacheSourceZipFileAssetId(mapped.id, data.sourceZipFileAssetId);
    return { ...mapped, sourceZipFileAssetId: data.sourceZipFileAssetId || mapped.sourceZipFileAssetId };
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
    const mapped = mapSeriesToProposal(res);
    cacheSourceZipFileAssetId(mapped.id, updatedData.sourceZipFileAssetId);
    return { ...mapped, sourceZipFileAssetId: updatedData.sourceZipFileAssetId || mapped.sourceZipFileAssetId };
  },

  /**
   * Delete a Draft proposal.
   */
  deleteDraft: async (id: string): Promise<boolean> => {
    try {
      await seriesService.deleteSeries(id);
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
      if (status === 'Active') backendStatus = 'Active';
      else if (status === 'Approved') backendStatus = 'Approved';
      else if (status === 'Rejected') backendStatus = 'Rejected';
      else if (status === 'Under Review') backendStatus = 'UnderReview';
      else if (status === 'Board Voting') backendStatus = 'BoardVoting';
      else if (status === 'Pending Review') backendStatus = 'PendingReview';
      
      await seriesService.updateProposalStatus(id, backendStatus, rejectReason);
      return true;
    } catch {
      return false;
    }
  }
};
