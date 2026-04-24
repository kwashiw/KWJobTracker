# KWJobTracker — CLAUDE.md

Personal job application tracking app built with React 19, TypeScript, Vite, Tailwind CSS, and Google Gemini AI.

---

## Running the App

```bash
cd /Users/kwashiwelbeck/Documents/Claude\ Code/Projects/KWJobTracker
npm run dev -- --port 3002
```

Runs at `http://localhost:3002/KWJobTracker/` (note the base path).

The preview server is registered in the workspace `.claude/launch.json` as **"KWJobTracker"** on port 3002.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript 5.6 |
| Build | Vite 6 |
| Styling | Tailwind CSS (CDN, JIT) |
| Icons | Lucide React |
| AI | Google Gemini (`@google/genai`) |
| PDF | PDF.js 3.11 (CDN) |
| Storage | `localStorage` only — no backend |

---

## Project Structure

```
KWJobTracker/
├── index.html              # Fonts, CSS vars, base styles
├── index.tsx               # React entry point
├── App.tsx                 # Main shell: header, nav, job cards, tab routing
├── types.ts                # All TypeScript interfaces & enums
├── vite.config.ts          # base: '/KWJobTracker/'
├── DevPreview.tsx          # Dev-only responsive preview toolbar
├── services/
│   └── gemini.ts           # All Gemini API calls (import, analysis, comparison)
└── components/
    ├── StatsSection.tsx        # 4-card career metrics row
    ├── AddJobModal.tsx         # New application form (bottom-sheet on mobile)
    ├── JobDetailModal.tsx      # Full job detail: description, notes, interviews, AI analysis
    ├── InterviewAgenda.tsx     # Schedule view (list + calendar toggle)
    ├── ResumeLab.tsx           # PDF/text resume viewer + AI match leaderboard
    ├── ArchiveView.tsx         # Archived/rejected jobs
    ├── SettingsModal.tsx       # Sync code, export/import, reset
    └── OfferComparisonModal.tsx # AI offer ranking engine
```

---

## Design System

### Theme: "Financial Terminal meets Luxury Editorial"

Dark background, warm cream text, gold accent. Set as CSS variables in `index.html`.

```css
:root {
  --bg:           #09090B;   /* near-black base */
  --bg-card:      #111114;   /* card surfaces */
  --bg-elevated:  #18181C;   /* modals, raised surfaces */
  --bg-input:     #0E0E12;   /* inputs, content areas */
  --border:       #1E1E28;   /* default border */
  --border-subtle:#181820;   /* section dividers */
  --text-primary: #F0EBE1;   /* warm cream white */
  --text-secondary:#8A8A92;  /* body text */
  --text-muted:   #4A4A52;   /* labels, captions */
  --text-faint:   #2A2A32;   /* watermarks, placeholders */
  --gold:         #C8933A;   /* THE accent — use sparingly */
  --gold-hover:   #D4A44A;
  --gold-dim:     rgba(200,147,58,0.12);
}
```

**Rule:** Gold is the only accent color. Never reintroduce indigo/purple.

### Typography

- **`font-display`** (CSS class) → `Cormorant Garamond` serif — headings, modal titles, section names
- **`DM Mono`** monospace — set on `body`, used everywhere else
- Both loaded from Google Fonts in `index.html`

Apply serif headings with: `className="font-display text-2xl font-semibold"`

### Status Colors (job cards & detail modal)

| Status | Left border | Badge bg | Badge text |
|---|---|---|---|
| Applied | `border-l-sky-500` | `bg-sky-950/50` | `text-sky-400` |
| Interviewing | `border-l-violet-500` | `bg-violet-950/50` | `text-violet-400` |
| Offer | `border-l-emerald-500` | `bg-emerald-950/50` | `text-emerald-400` |
| Rejected | `border-l-rose-600` | `bg-rose-950/50` | `text-rose-500` |

This config lives in `App.tsx` as `STATUS_CONFIG` and in `JobDetailModal.tsx` as `STATUS_COLORS`.

### Animations (defined in `index.html`)

| Class | Effect |
|---|---|
| `.kw-slide-up` | Fade in + translate Y — page/tab transitions |
| `.kw-zoom-in` | Scale up — modals |
| `.kw-slide-down` | Fade in + translate Y down — dropdowns, inline reveals |
| `.kw-fade-in` | Simple fade |
| `.card-stagger` | Staggered reveal for grid children (10 steps × 40ms) |
| `.nav-active::before` | Gold top-line on active nav tab |
| `.gold-focus` | Gold ring on focus for inputs |

Apply staggered cards by wrapping the grid in `className="card-stagger"`.

### Styling Conventions

- Use **inline `style` props with CSS vars** for dark-theme colors (e.g. `style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}`).
- Use **Tailwind** for layout, spacing, sizing, and standard colors (sky, violet, emerald, rose).
- Use `onMouseEnter/Leave` for hover state changes when Tailwind `hover:` can't target CSS vars.
- Modals: `bg-black/80 backdrop-blur-sm` overlay + `kw-zoom-in` container.
- No white backgrounds anywhere. No `bg-white`, `bg-slate-*`, `text-slate-*`.

---

## Data Layer

### localStorage Keys

| Key | Contents |
|---|---|
| `kw_track_jobs` | `JobApplication[]` — full job array |
| `kw_resume_data` | `ResumeData` — type, content (PDF DataURL or text), extractedText |

### Key Types (`types.ts`)

- `JobStatus` enum: `Applied | Interviewing | Offer | Rejected`
- `JobApplication`: id, title, company, description, salaryRange, status, dateAdded, dateModified, link?, interviews[], analysis?, isArchived?, notes?
- `Interview`: id, stage, interviewer, date (ISO), mode (Remote|In-Person), link?, preTodos[], postTodos[], remindersSet
- `MatchAnalysis`: score (0–100), strengths[], gaps[]
- `OfferEvaluation`: rank, company, title, why, pros[], cons[]
- `ResumeData`: type ('text'|'pdf'), content, extractedText

---

## Gemini AI Integration (`services/gemini.ts`)

| Function | Model | Purpose |
|---|---|---|
| `extractJobDetails(description)` | gemini-2.5-flash-preview | Extract company + salary from job description |
| `magicImport(url)` | gemini-2.5-flash-preview | Scrape job details from URL (CORS proxy + Google Search grounding) |
| `analyzeJobMatch(resume, description)` | gemini-2.5-pro-preview | Resume vs job match score + strengths/gaps |
| `compareOffers(offers[])` | gemini-2.5-flash-preview | Rank multiple offers with pros/cons |

API key loaded from `process.env.API_KEY` (set in `.env` as `API_KEY=...`).

Retry logic: exponential backoff on 429/503/504 errors.

---

## Navigation Tabs

| Tab | `activeTab` value | Component |
|---|---|---|
| Funnel | `'tracker'` | Job cards grid in `App.tsx` |
| Schedule | `'interviews'` | `InterviewAgenda` |
| Resume | `'resume'` | `ResumeLab` |
| Archive | `'archive'` | `ArchiveView` |

---

## Deployment

GitHub Pages at `/KWJobTracker/` — the `base` in `vite.config.ts` is already set.

```bash
npm run build   # outputs to dist/
```
