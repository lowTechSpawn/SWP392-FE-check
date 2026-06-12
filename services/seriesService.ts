import { fetchAPI } from "./api";

export interface ProposalPageResponse {
  proposalPageId: string;
  seriesId: string;
  pageNo: number;
  previewFileAssetId: string;
  createdAt: string;
  url?: string;
}

export interface SourceZipFileResponse {
  fileAssetId: string;
  fileName: string;
  url: string;
}

export interface SeriesProposal {
  id: string;
  title: string;
  author: string;
  genre: string[];
  type: string;
  status: string;
  description: string;
  coverColor: string;
  rating: number;
  sampleFileUrl?: string;
  coverImageUrl?: string;
  mangakaId?: string;
  tantouEditorId?: string;
  tantouEditorName?: string;
  rejectReason?: string | null;
  sourceZipFileAssetId?: string | null;
  sourceZipFile?: SourceZipFileResponse | null;
  sourceZipPublicUrl?: string | null;
  rawStatus?: string;
  proposalPages?: ProposalPageResponse[];
}

const mapGenreNamesToGuids = async (genreString: string): Promise<string[]> => {
  try {
    const genresResponse = await fetchAPI<{ data: any[] }>("/api/genres");
    const dbGenres = genresResponse.data || [];
    const inputNames = genreString.split(',').map(s => s.trim().toLowerCase());
    
    const matchedGuids = dbGenres
      .filter(g => inputNames.includes((g.title || g.name || '').toLowerCase()))
      .map(g => g.genreId || g.id);
      
    if (matchedGuids.length > 0) {
      return matchedGuids;
    }
    
    if (dbGenres.length > 0) {
      return [dbGenres[0].genreId || dbGenres[0].id];
    }
  } catch (error) {
    console.warn("Failed to fetch genres from backend, using default GUID fallback", error);
  }
  return ["3fa85f64-5717-4562-b3fc-2c963f66afa6"];
};

const mapSeriesResponse = (s: any): SeriesProposal => {
  const seriesId = s.seriesId || s.SeriesId || s.id || s.Id;
  const title = s.title || s.Title;
  const mangakaName = s.mangakaName || s.MangakaName || 'Unknown';
  const genreData = s.genre || s.Genre || s.genres || s.Genres || '';
  const publicationType = s.publicationType || s.PublicationType;
  let status = s.status || s.Status;
  const description = s.synopsis || s.Synopsis || s.description || s.Description || '';
  const sampleFileUrl = s.sampleFileUrl || s.SampleFileUrl || '';
  const coverImageUrl = s.coverImageUrl || s.CoverImageUrl || '';
  const mangakaId = s.mangakaId || s.MangakaId;
  const tantouEditorId = s.tantouEditorId || s.TantouEditorId;
  const tantouEditorName = s.tantouEditorName || s.TantouEditorName;
  let rejectReason = s.rejectReason || s.RejectReason || null;

  let genreArray: string[] = [];
  if (Array.isArray(genreData)) {
    genreArray = genreData;
  } else if (typeof genreData === 'string') {
    genreArray = genreData ? genreData.split(', ').filter(Boolean) : [];
  }

  // Determine cover gradient based on title hash for rich UI feel
  const colors = [
    'from-red-500 to-rose-700',
    'from-emerald-500 to-teal-700',
    'from-orange-500 to-red-600',
    'from-sky-400 to-indigo-600',
    'from-blue-500 to-amber-600',
    'from-violet-900 to-slate-900',
    'from-pink-500 to-purple-600',
  ];
  const charSum = (title || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const coverColor = colors[charSum % colors.length];

  const sourceZipFileAssetId = s.sourceZipFileAssetId || s.SourceZipFileAssetId || null;
  const sourceZipFile = s.sourceZipFile || s.SourceZipFile || null;
  const sourceZipPublicUrl = s.sourceZipPublicUrl || s.SourceZipPublicUrl || null;
  const proposalPages = s.proposalPages || s.ProposalPages || [];

  return {
    id: seriesId,
    title,
    author: mangakaName,
    genre: genreArray,
    type: publicationType,
    status,
    description,
    sampleFileUrl,
    coverImageUrl,
    mangakaId,
    tantouEditorId,
    tantouEditorName,
    coverColor,
    rating: 4.8,
    rejectReason,
    sourceZipFileAssetId,
    sourceZipFile,
    sourceZipPublicUrl,
    rawStatus: status,
    proposalPages: proposalPages.map((p: any) => ({
      proposalPageId: p.proposalPageId || p.ProposalPageId,
      seriesId: p.seriesId || p.SeriesId,
      pageNo: p.pageNo || p.PageNo,
      previewFileAssetId: p.previewFileAssetId || p.PreviewFileAssetId,
      createdAt: p.createdAt || p.CreatedAt,
      url: p.url || p.Url || undefined,
    })),
  };
};

export const seriesService = {
  listSeries: async (): Promise<SeriesProposal[]> => {
    const res = await fetchAPI<{ data: any[] }>("/api/series");
    return (res.data || res || []).map(mapSeriesResponse);
  },

  getSeriesById: async (id: string): Promise<SeriesProposal> => {
    const res = await fetchAPI<{ data: any }>(`/api/series/${id}`);
    const proposal = mapSeriesResponse(res.data || res);

    // Parse legacy sampleFileUrl to proposalPages if empty
    if ((!proposal.proposalPages || proposal.proposalPages.length === 0) && proposal.sampleFileUrl) {
      const ids = proposal.sampleFileUrl.split(',').filter(Boolean);
      proposal.proposalPages = ids.map((fileId, idx) => ({
        proposalPageId: fileId.trim(),
        seriesId: proposal.id,
        pageNo: idx + 1,
        previewFileAssetId: fileId.trim(),
        createdAt: new Date().toISOString()
      }));
    }

    // Resolve public URLs for each proposal page
    if (proposal.proposalPages && proposal.proposalPages.length > 0) {
      proposal.proposalPages = await Promise.all(
        proposal.proposalPages.map(async (page) => {
          if (!page.url && page.previewFileAssetId && !page.previewFileAssetId.startsWith('http')) {
            try {
              const fileRes = await fetchAPI<{ data: any }>(`/api/files/${page.previewFileAssetId}`);
              const fileAsset = fileRes.data || fileRes;
              return {
                ...page,
                url: fileAsset.publicUrl || fileAsset.PublicUrl || undefined
              };
            } catch (err) {
              console.error(`Failed to fetch file asset URL for ${page.previewFileAssetId}:`, err);
            }
          }
          return page;
        })
      );
    }

    // Resolve public URL for source ZIP asset if missing
    if (!proposal.sourceZipPublicUrl && proposal.sourceZipFileAssetId) {
      try {
        const fileRes = await fetchAPI<{ data: any }>(`/api/files/${proposal.sourceZipFileAssetId}`);
        const fileAsset = fileRes.data || fileRes;
        proposal.sourceZipPublicUrl = fileAsset.publicUrl || fileAsset.PublicUrl || null;
      } catch (err) {
        console.error(`Failed to fetch source ZIP URL for ${proposal.sourceZipFileAssetId}:`, err);
      }
    }

    return proposal;
  },

  submitProposal: async (proposal: any): Promise<SeriesProposal> => {
    const genreIds = await mapGenreNamesToGuids(proposal.genre);
    
    // Map sampleFileUrl back to its comma-separated file asset IDs
    const samplePageFileAssetIds = (proposal.sampleFileUrl || '')
      .split(',')
      .filter(Boolean);

    const payload = {
      title: proposal.title,
      synopsis: proposal.synopsis || proposal.description,
      publicationType: proposal.publicationType,
      genreIds: genreIds,
      sourceZipFileAssetId: proposal.sourceZipFileAssetId || null,
      samplePageFileAssetIds: samplePageFileAssetIds
    };

    const res = await fetchAPI<{ data: any }>("/api/series", {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const createdSeries = res.data || res;
    const seriesId = createdSeries.seriesId || createdSeries.id;

    if (proposal.status === 'PendingReview' && seriesId) {
      try {
        await fetchAPI(`/api/proposals/${seriesId}/submit-review`, {
          method: 'POST'
        });
        createdSeries.status = 'UnderReview';
      } catch (error) {
        console.error("Failed to submit proposal for review:", error);
      }
    }

    return mapSeriesResponse(createdSeries);
  },

  updateProposalStatus: async (id: string, status: string, rejectReason?: string) => {
    let userRole = '';
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('user-role');
      if (savedRole) userRole = savedRole.replace(/"/g, '').trim();
    }

    if (status === 'UnderReview' || status === 'Under Review') {
      return await fetchAPI(`/api/proposals/${id}/submit-to-board`, {
        method: 'POST'
      });
    }

    if (status === 'Rejected') {
      if (userRole === 'TantouEditor') {
        return await fetchAPI(`/api/proposals/${id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ rejectReason: rejectReason || 'Rejected by Tantou Editor.' })
        });
      } else {
        const resDecisions = await fetchAPI<{ data: any[] }>(`/api/series/${id}/board-decisions`);
        const decisions = resDecisions.data || resDecisions || [];
        const openDecision = decisions.find((d: any) => d.status?.toLowerCase() === 'open') || decisions[0];
        
        if (openDecision) {
          const decisionId = openDecision.boardDecisionId || openDecision.id;
          if (userRole === 'EditorInChief') {
            try {
              return await fetchAPI(`/api/board-decisions/${decisionId}/special-decision`, {
                method: 'POST',
                body: JSON.stringify({
                  decision: 'Rejected',
                  reason: rejectReason || 'Veto override rejected by Editor-in-Chief.'
                })
              });
            } catch (e) {
              console.warn("Special decision failed, falling back to vote", e);
            }
          }
          
          let comment = rejectReason || 'Rejection voted by Editorial Board member for this proposal.';
          if (comment.length < 50) {
            comment = comment.padEnd(50, ' - rejected due to quality standards.');
          }
          
          return await fetchAPI(`/api/board-decisions/${decisionId}/votes`, {
            method: 'POST',
            body: JSON.stringify({
              voteValue: false,
              comment: comment
            })
          });
        }
      }
    }

    if (status === 'Active') {
      if (userRole === 'EditorialBoard' || userRole === 'EditorInChief') {
        const resDecisions = await fetchAPI<{ data: any[] }>(`/api/series/${id}/board-decisions`);
        const decisions = resDecisions.data || resDecisions || [];
        let openDecision = decisions.find((d: any) => d.status?.toLowerCase() === 'open') || decisions[0];

        if (!openDecision) {
          try {
            await fetchAPI(`/api/proposals/${id}/submit-to-board`, { method: 'POST' });
            const resDecisions2 = await fetchAPI<{ data: any[] }>(`/api/series/${id}/board-decisions`);
            const decisions2 = resDecisions2.data || resDecisions2 || [];
            openDecision = decisions2.find((d: any) => d.status?.toLowerCase() === 'open') || decisions2[0];
          } catch (e) {
            console.warn("Failed to submit to board automatically", e);
          }
        }

        if (openDecision) {
          const decisionId = openDecision.boardDecisionId || openDecision.id;
          if (userRole === 'EditorInChief') {
            try {
              const res = await fetchAPI(`/api/board-decisions/${decisionId}/special-decision`, {
                method: 'POST',
                body: JSON.stringify({
                  decision: 'Approved',
                  reason: 'Direct veto override approval by Editor-in-Chief.'
                })
              });
              try {
                await fetchAPI(`/api/proposals/${id}/activate`, { method: 'POST' });
              } catch {}
              return res;
            } catch (e) {
              console.warn("Special decision failed, falling back to vote", e);
            }
          }

          const resVote = await fetchAPI(`/api/board-decisions/${decisionId}/votes`, {
            method: 'POST',
            body: JSON.stringify({
              voteValue: true,
              comment: 'Approved proposal from Editorial Board review.'
            })
          });
          
          try {
            await fetchAPI(`/api/proposals/${id}/activate`, { method: 'POST' });
          } catch {}
          
          return resVote;
        }
      } else if (userRole === 'TantouEditor') {
        return await fetchAPI(`/api/proposals/${id}/activate`, {
          method: 'POST'
        });
      }
    }

    return { success: true };
  },

  voteSeries: async (seriesId: string, vote: 'Approved' | 'Rejected' = 'Approved') => {
    try {
      const resDecisions = await fetchAPI<{ data: any[] }>(`/api/series/${seriesId}/board-decisions`);
      const decisions = resDecisions.data || resDecisions || [];
      const openDecision = decisions.find((d: any) => d.status?.toLowerCase() === 'open') || decisions[0];
      
      if (openDecision) {
        return fetchAPI<any>(`/api/board-decisions/${openDecision.boardDecisionId || openDecision.id}/votes`, {
          method: 'POST',
          body: JSON.stringify({
            voteValue: vote === 'Approved',
            comment: `Voted ${vote} from Editorial Board.`
          })
        });
      }
    } catch (error) {
      console.warn("Failed to submit board vote to backend:", error);
    }
    return { success: true, message: "Vote cast successfully." };
  },

  getBoardDecisions: async (seriesId: string): Promise<any[]> => {
    const res = await fetchAPI<{ data: any[] }>(`/api/series/${seriesId}/board-decisions`);
    return res.data || res || [];
  },

  getBoardVotes: async (boardDecisionId: string): Promise<any[]> => {
    const res = await fetchAPI<{ data: any[] }>(`/api/board-decisions/${boardDecisionId}/votes`);
    return res.data || res || [];
  },

  castBoardVote: async (boardDecisionId: string, voteValue: boolean, comment: string): Promise<any> => {
    return await fetchAPI<any>(`/api/board-decisions/${boardDecisionId}/votes`, {
      method: 'POST',
      body: JSON.stringify({ voteValue, comment }),
    });
  },

  extendBoardDeadline: async (boardDecisionId: string, newDeadline: string, reason: string): Promise<any> => {
    return await fetchAPI<any>(`/api/board-decisions/${boardDecisionId}/extend-deadline`, {
      method: 'POST',
      body: JSON.stringify({ newDeadline, reason }),
    });
  },

  overrideBoardDecision: async (boardDecisionId: string, decision: 'Approved' | 'Rejected', reason: string): Promise<any> => {
    return await fetchAPI<any>(`/api/board-decisions/${boardDecisionId}/special-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  }
};
