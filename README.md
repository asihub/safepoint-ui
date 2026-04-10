# safepoint-ui

> React 19 frontend for SafePoint — an anonymous mental health crisis screening platform combining clinically validated questionnaires, AI-assisted risk analysis, safety planning, and location-aware resource navigation.

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool and dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | 7.13 | Client-side routing |
| Axios | 1.14 | HTTP client (proxied to API port 8080) |
| Leaflet + react-leaflet | 1.9 / 5.0 | OpenStreetMap facility map |
| jsPDF | 4.2 | Client-side PDF report generation |
| lucide-react | 1.7 | Icon set |
| @types/fhir | 0.0.41 | FHIR R4 type definitions |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Mode selection — Quick Check · I Need Help Now · Worried About Someone |
| `/screening` | Screening | PHQ-9 + GAD-7 questionnaires with proxy mode and EN/ES switching |
| `/text` | Free Text | Optional AI text input + insurance type selector |
| `/results` | Results | Risk badge · questionnaire scores · AI signals · explanation |
| `/resources` | Resources | SAMHSA facility map (Leaflet/OpenStreetMap) + ZIP geocoding |
| `/wellbeing` | Wellbeing | AI-summarized self-help articles grouped by category |
| `/safety-plan` | Safety Plan | Stanley-Brown 6-step plan with anonymous save/load/delete |
| `/auth` | Auth | Anonymous registration and credential verification |
| `/progress` | Progress | Assessment history with bar chart and trend |

---

## Key Features

- **Fully anonymous** — no account, email, or personal data required
- **Two assessment modes** — self-assessment and proxy mode (for caregivers)
- **EN/ES localization** — language switching with auto-detect from browser locale
- **FHIR R4 export** — LOINC-coded QuestionnaireResponse bundle for healthcare providers
- **PDF export** — client-side report with risk level, scores, signals, and crisis resources
- **Offline-capable** — safety plan accessible without internet (localStorage)
- **Progressive Web App** — installable on mobile and desktop

---

## Architecture

All user data stays in the browser — no cookies, no tracking, no analytics.

```
Browser
  ├── useAssessment (React Context) — questionnaire state, scores, result
  ├── useHistory (localStorage)    — assessment history, never sent to server
  ├── useLanguage (localStorage)   — EN/ES preference
  └── Axios client                 — proxied to Spring Boot API (port 8080)
```

Assessment flow:
```
Home → Screening → Free Text → Results → Resources / Safety Plan / Wellbeing
```

---

## Running Locally

### Prerequisites
- Node.js 18+

### Install and start
```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

Requires `safepoint-api` running on port 8080 for full functionality.

### Build for production
```bash
npm run build
```

---

## Privacy

- No cookies, no analytics, no tracking
- Assessment history stored in browser `localStorage` only — never sent to server
- Free text for AI analysis is sent to the API and processed in memory — never logged or persisted
- Anonymous identity: human-readable username (`blue-river-42`) + 4-digit PIN

---

## Related Repositories

| Repository | Description |
|---|---|
| [safepoint-api](https://github.com/asihub/safepoint-api) | Java Spring Boot API |
| [safepoint-ml](https://github.com/asihub/safepoint-ml) | Python ML service (DistilBERT + BART) |
