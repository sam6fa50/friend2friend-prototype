# Friend2Friend — Test Plan

## 1.1 Scope

### In scope

| Feature / Component | Why it matters |
|---|---|
| Interest subscription (subscribe, unsubscribe, toggle active/inactive) | Core matching logic depends entirely on this; bugs here break visibility for everyone |
| User bio (write, publish, moderation, preview) | First thing other users see; moderation failure is a safety risk |
| In-app chat (send message, accept/reject invite, DM creation) | Primary communication feature; failure breaks the app's core value |
| Leaderboard (rankings, personal stats card, blocked user display) | High visibility feature; incorrect rankings damage user trust |
| Tinder-style matching / Discover (swipe, range filter, interest filter) | The main entry point of the app; broken matching means no connections |
| User blocking (scoped block, effect on chat/bio/discover) | Safety-critical; a bug here is a serious user protection failure |
| Profile badges (earn, equip, 5-badge limit, visibility to others) | Tied to engagement; limit enforcement needs to be correct |
| Onboarding flow (interest selection, radius setup) | Every new user hits this; a bug here means no one gets into the app |
| Supabase database layer (RLS policies, migrations, PostGIS queries) | All features depend on this; data integrity and security live here |

### Out of scope

| Feature / Component | Why excluded |
|---|---|
| Supabase Auth internals | Third-party service — Supabase tests their own auth infrastructure |
| PostGIS extension correctness | Third-party library — we test our queries, not the extension itself |
| GitHub Pages hosting / CDN availability | Infrastructure outside our control; unpkg and Pages uptime are not our responsibility |
| Browser compatibility beyond Chrome | Time constraint; documented decision |
| Push notifications | Not implemented in the current prototype |
| Native iOS / Android builds | Prototype runs as a web app in a simulated frame, not a native build |

## 1.2 Quality Goals

- No critical bug in any happy-path use case (subscribe to interest, swipe and match, send a message, publish a bio, view leaderboard)
- Blocking a user must immediately remove them from Discover, chat, and the bio view — zero tolerance for leakthrough
- Interest subscription enforces the 20-interest limit and duplicate prevention in 100% of cases
- Bio moderation rejects inappropriate content before it is ever persisted to the database
- Supabase RLS policies prevent any user from reading or writing another user's private data
- PostGIS range matching returns only users within both users' set radius — no one-sided visibility
- No unhandled promise rejections or silent failures on happy paths
- UI renders correctly inside the simulated iOS frame at 402×874 without layout breakage on the screens each team member owns

## 1.3 Risks & Priorities

| Area | Why it's risky / costly | Priority |
|---|---|---|
| RLS policy gaps in Supabase | A misconfigured row-level security policy could expose private user data to other users — security risk | H |
| Interest toggle not updating match visibility in real time | Users would see stale matches; core spec requirement is immediate update | H |
| Blocking leakthrough in Discover / chat | Safety-critical — a blocked user seeing someone's profile or messages is a serious failure | H |
| PostGIS range query correctness | One-sided visibility (User A sees User B but not vice versa) violates the mutual range requirement | H |
| Bio moderation false negatives | Inappropriate content published to profiles damages user safety and trust | H |
| 20-interest limit enforcement | Enforced only client-side would be bypassable; must be server-side too | M |
| Leaderboard ranking correctness | Incorrect ranks are visible to all users and damage credibility | M |
| Chat message ordering / delivery | Out-of-order messages are confusing but not dangerous | M |
| Badge equip limit (5 max) | Minor enforcement issue; cosmetic impact only | L |
| Onboarding replay via localStorage reset | Edge case; only affects developers replaying the flow | L |

## 1.4 Strategy

**Unit test:** A test that checks a single function or component in isolation, with all dependencies mocked or faked. It tells you whether a piece of logic is correct on its own.

**Integration test:** A test that checks how two or more components work together — for example, a React component talking to a real Supabase query, or a form submission that writes to the database. It tells you whether the pieces connect correctly.

| Component | Test types | Framework | Why this fit |
|---|---|---|---|
| React frontend (discover, messages, leaderboard, profile, onboarding) | Unit, integration | Vitest + React Testing Library | Vitest is native to Vite projects; React Testing Library tests components the way a user interacts with them |
| Supabase database + RLS policies | Integration | Supabase local dev + Jest or Vitest | Supabase CLI spins up a local Postgres instance so RLS and migrations can be tested without touching production |
| PostGIS range matching queries | Integration | Supabase local dev | Range matching logic lives in SQL functions; testing against a real local PostGIS instance is the only reliable way to verify spatial query results |
| Interest subscription logic (limit, dedupe, moderation) | Unit, integration | Vitest | Business rules are well-defined and easily unit tested; integration tests confirm they hold against the real DB |
| Blocking (scope enforcement across features) | Integration | Vitest + React Testing Library | Blocking spans multiple components — needs cross-component integration tests to verify leakthrough doesn't occur |
| Cross-cutting (concurrent swipes, simultaneous interest updates) | Load / concurrency | k6 or manual Supabase RPC stress test | Lightweight load testing to confirm RLS and matching hold under multiple simultaneous users |

## 1.5 Environment & Assumptions

- Frontend runs on Vite + React 18; tests assume Node 20
- Test database is a local Supabase instance (via Supabase CLI) running Postgres + PostGIS — not the production project
- All migrations (`0001_init.sql` through `0004_location.sql`) are run fresh before each test session
- Mock data comes from `data.jsx` (the existing UCI/Petr theme dataset); no shared global state between test runs
- Supabase Auth is mocked in unit tests; integration tests use seeded test user accounts with known UUIDs
- Tests run locally on macOS/Windows; CI would run on Ubuntu via GitHub Actions if configured
- The app requires an internet connection for the first load (unpkg CDN for React/Babel) — tests that run fully offline should use a local React build instead
- localStorage state is cleared between test runs to ensure onboarding flow tests start fresh

## 1.6 Team Roles

| Member | Owns which test categories / components |
|---|---|
| Abhinav | Bio feature tests: write/preview/publish flow, 255-character limit, moderation rejection, social media linking, location opt-in |
| Swathi | Chat tests: DM creation, message send/receive, invite accept/reject, blocked user chat behavior; Leaderboard tests: ranking correctness, personal stats card, blocked user display |
| Brandon | Interest subscription tests: subscribe, unsubscribe, toggle active/inactive, 20-limit enforcement, duplicate prevention, new interest creation and moderation |
| Samyak | Discover/matching tests: swipe logic, PostGIS range matching, mutual visibility, interest filter correctness, blocking effect on Discover deck |
| Shared (all members) | RLS policy tests for their own feature's database tables; end-to-end happy path test for their own feature's primary use case |
