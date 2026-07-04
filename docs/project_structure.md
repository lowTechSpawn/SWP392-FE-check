# Frontend Project Structure

This document describes the current Next.js frontend workspace at `FE-nextjs/my-app`.
Backend source directories are intentionally excluded.

## Top-Level Structure

```text
my-app/
├── app/                  # Next.js App Router routes, layouts, global styles
├── components/           # Shared React components and UI primitives
├── context/              # React context providers
├── docs/                 # Frontend documentation
├── hooks/                # Shared React hooks
├── lib/                  # Constants, validation, utilities, client-side logic
├── public/               # Static assets served by Next.js
├── services/             # API client and feature service modules
├── store/                # Client-side stores
├── types/                # Shared TypeScript types
├── components.json       # shadcn/ui configuration
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Scripts and dependencies
├── postcss.config.mjs    # PostCSS configuration
└── tsconfig.json         # TypeScript configuration
```

Ignored/generated folders such as `.next/`, `node_modules/`, `.git/`, `.codex/`, `.agents/`, and `.vscode/` are not part of the documented application structure.

## `app/`

Next.js App Router entry point. Route folders map directly to URLs.

```text
app/
├── dashboard/
│   ├── admin/page.tsx
│   ├── assistant/page.tsx
│   ├── chapters/page.tsx
│   ├── editor-in-chief/page.tsx
│   ├── manga-list/page.tsx
│   ├── mangaka/page.tsx
│   ├── manuscripts/page.tsx
│   ├── profile/page.tsx
│   ├── ranking/page.tsx
│   ├── reviews/page.tsx
│   ├── series/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── tantou-editor/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── login/page.tsx
├── signup/page.tsx
├── globals.css
├── layout.tsx
└── page.tsx
```

Key files:

- `app/layout.tsx`: root layout and global providers.
- `app/globals.css`: global styles and design tokens.
- `app/page.tsx`: public landing page.
- `app/login/page.tsx`, `app/signup/page.tsx`: authentication pages.
- `app/dashboard/layout.tsx`: dashboard shell with sidebar/header.
- `app/dashboard/page.tsx`: role-based dashboard redirect.

Main dashboard routes:

- `admin/page.tsx`: admin management workspace.
- `assistant/page.tsx`: assistant task workspace.
- `chapters/page.tsx`: chapter management, page tasks, assistant review flow.
- `editor-in-chief/page.tsx`: editor-in-chief dashboard.
- `manga-list/page.tsx`: active manga/series list.
- `mangaka/page.tsx`: mangaka dashboard.
- `manuscripts/page.tsx`: manuscript review and annotation workspace.
- `profile/page.tsx`: current user profile page.
- `ranking/page.tsx`: ranking and vote records.
- `reviews/page.tsx`: editorial board review/voting page.
- `series/page.tsx`: mangaka proposal list.
- `series/new/page.tsx`: create/edit proposal page.
- `tantou-editor/page.tsx`: tantou editor proposal and manuscript review workspace.

## `components/`

Shared React components.

```text
components/
├── annotations/
│   └── image-comment-layer.tsx
├── common/
│   ├── dashboard-header.tsx
│   ├── empty-state.tsx
│   ├── loading.tsx
│   ├── navbar.tsx
│   └── sidebar.tsx
├── forms/
│   ├── chapter-task-form.tsx
│   ├── index.ts
│   ├── manuscript-form.tsx
│   ├── series-proposal-form.tsx
│   └── vote-entry-form.tsx
├── layout/
├── providers/
├── ui/
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── field.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── progress.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sonner.tsx
│   └── table.tsx
├── workflow/
├── login-form.tsx
└── signup-form.tsx
```

Important areas:

- `components/ui/`: low-level UI primitives.
- `components/common/`: navigation, sidebar, header, empty/loading states.
- `components/forms/`: domain forms for proposals, manuscripts, tasks, votes.
- `components/annotations/image-comment-layer.tsx`: image annotation overlay.
- `components/login-form.tsx`, `components/signup-form.tsx`: auth form components.

## `context/`

```text
context/
└── RoleContext.tsx
```

- `RoleContext.tsx`: provides role state and `useRole()` for dashboard routing and role-specific UI.

## `hooks/`

```text
hooks/
├── index.ts
├── useAuth.ts
├── useDeadlineAlerts.ts
├── useNotifications.ts
└── useRoleDashboard.ts
```

- `useAuth.ts`: current auth/user helpers.
- `useDeadlineAlerts.ts`: deadline alert logic.
- `useNotifications.ts`: notification loading and read-state behavior.
- `useRoleDashboard.ts`: role-based dashboard routing helper.

## `lib/`

```text
lib/
├── business-logic.ts
├── chapters-store.ts
├── constants.ts
├── imageCompare.ts
├── roles.ts
├── salary.ts
├── supabase.ts
├── utils.ts
└── validation.ts
```

- `business-logic.ts`: shared calculations such as chapter progress and vote score.
- `chapters-store.ts`: shared chapter/task types and constants used by chapter UI.
- `constants.ts`: app constants, API base URL, status constants.
- `imageCompare.ts`: image comparison helpers.
- `roles.ts`: role constants.
- `salary.ts`: salary/payment calculations.
- `supabase.ts`: Supabase client/config helpers.
- `utils.ts`: generic utilities such as class name merging.
- `validation.ts`: Zod schemas for forms and domain input validation.

## `services/`

API boundary for frontend feature modules. `services/api.ts` builds requests against `NEXT_PUBLIC_API_URL` or default `http://localhost:5151`.

```text
services/
├── api.ts
├── authService.ts
├── chapterService.ts
├── manuscriptService.ts
├── proposalService.ts
├── rankingService.ts
├── reviewService.ts
├── seriesService.ts
├── signalrService.ts
├── systemService.ts
├── taskService.ts
├── tokenService.ts
├── userService.ts
└── voteService.ts
```

Main responsibilities:

- `api.ts`: shared `fetchAPI` wrapper with JSON headers and bearer token handling.
- `tokenService.ts`: token storage, refresh, and session cleanup.
- `authService.ts`: login, registration, current user, avatar upload.
- `seriesService.ts`: series/proposal CRUD and workflow API calls.
- `proposalService.ts`: frontend proposal model mapping over `seriesService`.
- `chapterService.ts`: chapter APIs.
- `taskService.ts`: page task APIs.
- `manuscriptService.ts`: manuscript APIs and manuscript annotations.
- `reviewService.ts`: review-related APIs.
- `rankingService.ts`, `voteService.ts`: ranking and vote APIs.
- `systemService.ts`: system config such as genres.
- `userService.ts`: user and assignment APIs.
- `signalrService.ts`: notification hub client.

## `store/`

```text
store/
└── notificationStore.ts
```

- `notificationStore.ts`: client-side notification store used by dashboard flows.

## `types/`

Shared TypeScript contracts.

```text
types/
├── audit.ts
├── chapter.ts
├── dashboard.ts
├── forms.ts
├── index.ts
├── manuscript.ts
├── notification.ts
├── proposal.ts
├── review.ts
├── series.ts
├── task.ts
├── user.ts
└── vote.ts
```

## `public/`

Static files served from site root.

```text
public/
├── images/
├── file.svg
├── globe.svg
├── logo.png
├── logo.svg
├── next.svg
├── vercel.svg
└── window.svg
```

## `docs/`

Project documentation kept with frontend source.

```text
docs/
├── AGENTS.md
├── API_CONTRACT.md
├── CLAUDE.md
├── EnforcedBRs.md
├── FORMS_VALIDATION.md
├── GUIDE_CHAPTER_WORKFLOW.md
├── GUIDE_NEW_TASK_FEATURES.md
├── IMPLEMENTATION_PLAN.md
├── project_structure.md
├── PROPOSAL_DOCUMENTATION.md
└── README.md
```

## Current Frontend Flow Summary

High-level data flow:

```text
page.tsx route
  -> component/form
  -> service module
  -> services/api.ts fetchAPI
  -> backend API
  -> mapped response/type
  -> page state/render
```

Common route/service pairings:

- Proposal creation/edit: `app/dashboard/series/new/page.tsx` -> `proposalService` -> `seriesService`.
- Proposal list: `app/dashboard/series/page.tsx` -> `proposalService`.
- Tantou editor review: `app/dashboard/tantou-editor/page.tsx` -> `seriesService`, `manuscriptService`, `userService`.
- Chapter/page task flow: `app/dashboard/chapters/page.tsx` -> `chapterService`, `taskService`, direct task/submission APIs.
- Assistant workspace: `app/dashboard/assistant/page.tsx` -> task/submission APIs.
- Manuscript review: `app/dashboard/manuscripts/page.tsx` -> `manuscriptService`.
- Admin/user management: `app/dashboard/admin/page.tsx` -> `userService`, `systemService`.

## Notes

- This document reflects frontend files currently present in `my-app`.
- Backend folder `MangaManagementSystem/` is intentionally not documented here.
- Generated folders and dependency folders are intentionally omitted.
