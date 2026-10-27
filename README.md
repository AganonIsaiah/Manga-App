# Manga app

- [Angular frontend](dashboard-ui/README.md)
- [FastAPI auth setup](backend/README.md)
- [Supabase authentication schema](backend/migrations/001_auth.sql)

Authentication uses FastAPI, Supabase Auth, Supabase Postgres profiles and HttpOnly JWT/refresh cookies. Other frontend features retain their mock adapters; backend feature placeholders are intentionally empty.

## Planned discovery features


1. For You Feed
- Hybrid ML recommender
- "Why this recommendation?" (maybe after user clicks start reading)
  - RAG explanation + recommendation evidence

2. (Natural Language) Search
- Semantic search + structured filters

3. Chatbot (i.e., Manga discover assistant)
- Chatbot + RAG + semantic search
- Kinda like the semantic search tab but with more detail