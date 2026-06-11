'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, BookOpen, Star } from 'lucide-react'
import { getProposals, type Proposal } from '@/lib/proposals-store'
import { getUsers } from '@/lib/users-store'

interface Manga {
  id: string
  title: string
  author: string
  genre: string[]
  type: string
  status: 'Active' | 'Proposed' | 'Deferred' | 'Rejected'
  description: string
  coverColor: string
  rating: number
}

export default function MangaListPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [mangaList, setMangaList] = useState<Manga[]>([])

  useEffect(() => {
    getProposals().then((proposals) => {
      const users = getUsers()

      const list: Manga[] = proposals.map((p) => {
        const authorUser = users.find((u) => u.id === p.mangakaId)
        const authorName = authorUser ? authorUser.name : 'Unknown Author'

        const statusMap: Record<Proposal['status'], Manga['status']> = {
          Approved: 'Active',
          'Pending Review': 'Proposed',
          'Under Review': 'Proposed',
          Draft: 'Proposed',
          Rejected: 'Rejected',
          Active: 'Active',
        }

        const colors = [
          'from-red-500 to-rose-700',
          'from-emerald-500 to-teal-700',
          'from-orange-500 to-red-600',
          'from-sky-400 to-indigo-600',
          'from-blue-600 to-cyan-700',
          'from-pink-500 to-purple-600',
        ]
        const colorIdx = Math.abs(p.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length
        const coverColor = colors[colorIdx]

        return {
          id: p.id,
          title: p.title,
          author: authorName,
          genre: p.genre ? p.genre.split(', ') : [],
          type: p.publicationType,
          status: statusMap[p.status] || 'Proposed',
          description: p.synopsis,
          coverColor,
          rating: 4.5 + (p.title.length % 5) * 0.1,
        }
      })
      setMangaList(list)
    })
  }, [])

  // Filter logic
  const filteredManga = mangaList.filter((manga) => {
    const matchesSearch =
      manga.title.toLowerCase().includes(search.toLowerCase()) ||
      manga.author.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || manga.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Manga List
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage all serialization proposals and active manga series
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-2.5 text-sm">
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

      {/* Manga Grid */}
      {filteredManga.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredManga.map((manga) => (
            <div
              key={manga.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              {/* Cover Card Mockup */}
              <div className={`bg-gradient-to-br ${manga.coverColor} h-40 p-5 flex flex-col justify-between text-white relative overflow-hidden`}>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                {/* Top badges */}
                <div className="flex justify-between items-start z-10">
                  <span className="bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                    {manga.type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold z-10 ${manga.status === 'Active'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                    }`}>
                    {manga.status}
                  </span>
                </div>

                {/* Cover Title Info */}
                <div className="z-10">
                  <h3 className="font-extrabold text-lg leading-tight group-hover:underline cursor-pointer">
                    {manga.title}
                  </h3>
                  <p className="text-xs text-white/80 font-semibold mt-1">by {manga.author}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {manga.description}
                </p>

                {/* Genres & Rating footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex flex-wrap gap-1">
                    {manga.genre.map((g) => (
                      <span
                        key={g}
                        className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-amber-500">
                    <Star className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-foreground">{manga.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-lg text-foreground">No manga found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keywords or filter terms to find what you are looking for.
          </p>
        </div>
      )}
    </div>
  )
}
