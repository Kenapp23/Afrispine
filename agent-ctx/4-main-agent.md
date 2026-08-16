---
Task ID: 4
Agent: Main Agent
Task: Upgrade search and For You feed APIs with hybrid search and weighted scoring

Files Modified:
- `src/app/api/content/search/route.ts` — Rewritten with hybrid keyword + fuzzy trigram search and relevance scoring
- `src/app/api/content/foryou/route.ts` — Rewritten with 4-dimension weighted composite scoring
- `worklog.md` — Appended Task 4 entry

Key Decisions:
- Fuzzy matching implemented as in-memory trigram substring filtering (SQLite has no built-in trigram support)
- Keyword matches fetched first via Prisma `contains`, then fuzzy candidates fetched separately and deduplicated
- Engagement bonus uses additive formula (viewCount*0.01 + likeCount*0.05 + shareCount*0.1) as specified
- ForYou engagement score split into normalized likes (0-30) + engagement ratio bonus (0-15) per spec
- Follow affinity lookups wrapped in try/catch for graceful degradation
- Both routes maintain identical response shape to previous version (same select fields)
- ESLint passes clean
