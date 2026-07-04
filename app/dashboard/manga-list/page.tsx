'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Filter, Search, Star, Tags, User, UserCheck } from 'lucide-react'
import { proposalService } from '@/services/proposalService'

const { getProposals } = proposalService

const COVER_COLORS = [
  'from-red-500 to-rose-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-red-600',
  'from-sky-400 to-indigo-600',
  'from-blue-600 to-cyan-700',
  'from-pink-500 to-purple-600',
]

interface Manga {
  id: string
  title: string
  author: string
  editor: string
  genre: string[]
  type: string
  description: string
  coverColor: string
  rating: number
  coverImageUrl?: string
}

function getCoverColor(title: string) {
  const colorIdx = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % COVER_COLORS.length
  return COVER_COLORS[colorIdx]
}

export default function MangaListPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [mangaList, setMangaList] = useState<Manga[]>([])

  useEffect(() => {
    getProposals().then((proposals) => {
      const list: Manga[] = proposals
        .filter((proposal) => proposal.status === 'Active')
        .map((proposal) => ({
          id: proposal.id,
          title: proposal.title,
          author: proposal.author || 'Unknown Author',
          editor: proposal.tantouEditorName || 'Chua gan editor',
          genre: proposal.genre ? proposal.genre.split(', ') : [],
          type: proposal.publicationType,
          description: proposal.synopsis,
          coverColor: getCoverColor(proposal.title),
          rating: 4.5 + (proposal.title.length % 5) * 0.1,
          coverImageUrl: proposal.coverImageUrl,
        }))

      setMangaList(list)
    })
  }, [])

  const filteredManga = mangaList.filter((manga) => {
    const query = search.toLowerCase()
    const matchesSearch =
      manga.title.toLowerCase().includes(query) ||
      manga.author.toLowerCase().includes(query) ||
      manga.editor.toLowerCase().includes(query)
    const matchesType = filterType === 'All' || manga.type === filterType

    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Manga List
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Browse active manga series</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author, editor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-foreground font-semibold focus:outline-none text-xs"
          >
            <option value="All">All Cycles</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="One-shot">One-shot</option>
          </select>
        </div>
      </div>

      {filteredManga.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredManga.map((manga) => (
            <article
              key={manga.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/25 hover:shadow-md transition-all group"
            >
              <div className="grid grid-cols-[96px_1fr] min-h-36">
                <div className="relative bg-slate-900 overflow-hidden">
                  {manga.coverImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={manga.coverImageUrl}
                      alt={manga.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${manga.coverColor}`} />
                  )}
                </div>

                <div className="min-w-0 p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {manga.title}
                      </h3>
                      <span className="mt-1 inline-flex bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {manga.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-extrabold text-foreground">{manga.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{manga.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{manga.editor}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-start gap-1.5 border-t border-border/50 pt-2">
                    <Tags className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1 overflow-hidden max-h-10">
                      {manga.genre.length > 0 ? manga.genre.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded"
                        >
                          {genre}
                        </span>
                      )) : (
                        <span className="text-[10px] text-muted-foreground">No genre</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-lg text-foreground">No manga found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keywords or filter terms.
          </p>
        </div>
      )}
    </div>
  )
}
