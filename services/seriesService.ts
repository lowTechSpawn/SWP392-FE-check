import { fetchWithFallback } from "./api";

export interface SeriesProposal {
  id: string;
  title: string;
  author: string;
  genre: string[];
  type: 'Weekly' | 'Monthly' | 'One-shot';
  status: 'Active' | 'Proposed' | 'Deferred' | 'Rejected';
  description: string;
  coverColor: string;
  rating: number;
}

export const MOCK_SERIES: SeriesProposal[] = [
  {
    id: 'S01',
    title: 'Demon Slayer: Chronicles',
    author: 'Koyoharu Gotouge',
    genre: ['Action', 'Fantasy'],
    type: 'Weekly',
    status: 'Active',
    description: 'A young man sets out to become a demon slayer to avenge his family and cure his sister.',
    coverColor: 'from-red-500 to-rose-700',
    rating: 4.9,
  },
  {
    id: 'S02',
    title: 'Spy x Family: Secret Mission',
    author: 'Tatsuya Endo',
    genre: ['Action', 'Comedy'],
    type: 'Weekly',
    status: 'Active',
    description: 'A spy on an undercover mission marries a professional assassin and adopts a telepathic child.',
    coverColor: 'from-emerald-500 to-teal-700',
    rating: 4.8,
  },
  {
    id: 'S03',
    title: 'Chainsaw Man: Part 2',
    author: 'Tatsuki Fujimoto',
    genre: ['Action', 'Horror', 'Thriller'],
    type: 'Weekly',
    status: 'Active',
    description: 'A young man merges with a chainsaw devil and hunts devils to survive in a chaotic world.',
    coverColor: 'from-orange-500 to-red-600',
    rating: 4.7,
  },
  {
    id: 'S04',
    title: 'Frieren: Beyond Journey\'s End',
    author: 'Kanehito Yamada',
    genre: ['Fantasy', 'Drama'],
    type: 'Monthly',
    status: 'Active',
    description: 'An elf mage and her former party members reflect on friendship and journey after defeating the demon king.',
    coverColor: 'from-sky-400 to-indigo-600',
    rating: 4.9,
  },
  {
    id: 'S05',
    title: 'One Piece: Wano Arc',
    author: 'Eiichiro Oda',
    genre: ['Action', 'Adventure', 'Fantasy'],
    type: 'Weekly',
    status: 'Active',
    description: 'Monkey D. Luffy and his crew fight to free the isolated land of Wano from Kaido\'s tyranny.',
    coverColor: 'from-blue-500 to-amber-600',
    rating: 4.95,
  },
  {
    id: 'S06',
    title: 'Jujutsu Kaisen: Culling Game',
    author: 'Gege Akutami',
    genre: ['Action', 'Supernatural'],
    type: 'Weekly',
    status: 'Proposed',
    description: 'Sorcerers and cursed spirits clash in a deadly battle royal orchestrated by Kenjaku.',
    coverColor: 'from-violet-900 to-slate-900',
    rating: 4.85,
  },
  {
    id: 'S07',
    title: 'My Hero Academia: Final War',
    author: 'Kohei Horikoshi',
    genre: ['Action', 'Sci-Fi'],
    type: 'Weekly',
    status: 'Proposed',
    description: 'The ultimate battle between the heroes and the league of villains led by Shigaraki Tomura.',
    coverColor: 'from-cyan-500 to-blue-600',
    rating: 4.75,
  },
  {
    id: 'S08',
    title: 'Attack on Titan: The Rumbling',
    author: 'Hajime Isayama',
    genre: ['Action', 'Drama', 'Mystery'],
    type: 'Monthly',
    status: 'Active',
    description: 'Eren Jaeger initiates the Rumbling, a catastrophic event sending colossal titans to flatten the earth.',
    coverColor: 'from-amber-800 to-stone-900',
    rating: 4.9,
  }
];

export const seriesService = {
  listSeries: async () => {
    return fetchWithFallback<SeriesProposal[]>("/api/series", MOCK_SERIES);
  },
  getSeriesById: async (id: string) => {
    const found = MOCK_SERIES.find(s => s.id === id) || MOCK_SERIES[0];
    return fetchWithFallback<SeriesProposal>(`/api/series/${id}`, found);
  },
  submitProposal: async (proposal: any) => {
    return fetchWithFallback<any>("/api/series/proposal", { success: true, proposal });
  },
  voteSeries: async (seriesId: string) => {
    return fetchWithFallback<any>(`/api/series/${seriesId}/vote`, { success: true, votes: 120 });
  }
};
