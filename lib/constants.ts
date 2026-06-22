// Application constants
export const APP_NAME = "My App";
export const APP_VERSION = "1.0.0";

// API endpoints
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE_URL = (rawApiUrl && rawApiUrl !== "undefined" && rawApiUrl !== "null" && rawApiUrl !== "")
  ? rawApiUrl
  : "http://localhost:5151";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
} as const;

export const SERIES_STATUS = {
  PROPOSED: 'Proposed',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  DEFERRED: 'Deferred',
  CANCELLED: 'Cancelled',
} as const

export const PAGE_TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In-Progress',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  UNASSIGNED: 'Unassigned',
  SUSPENDED: 'Suspended',
} as const

export const MANUSCRIPT_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required',
} as const

export const ROLE_NAMES = {
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'TantouEditor',
  EDITORIAL_BOARD: 'EditorialBoard',
  EDITOR_IN_CHIEF: 'EditorInChief',
} as const

// Business Constants
export const CHAPTER_DEADLINE_DAYS_BEFORE = 14
export const VOTING_QUORUM_REQUIRED = 3
export const MAX_REVISION_CYCLES = 3
export const BOTTOM_PERCENTILE_FOR_CANCELLATION = 20

export const PUBLICATION_CYCLES = {
  Weekly: 7,
  Monthly: 30,
  'One-shot': null,
} as const
