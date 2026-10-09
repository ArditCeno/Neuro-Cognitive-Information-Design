# NCID Backend (Spring Boot + Supabase/PostgreSQL)

REST API that receives anonymous study sessions from the web app and stores
them in Supabase (PostgreSQL).

> Copyright (c) 2025 Ardit Ceno. All rights reserved. Proprietary — see `../LICENSE`.

## Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | none | liveness |
| POST | `/api/sessions` | none | participant submits one session |
| POST | `/api/sessions/batch` | `X-Admin-Token` | bulk import |
| GET | `/api/sessions?limit=&offset=` | `X-Admin-Token` | list sessions |
| GET | `/api/sessions/{id}` | `X-Admin-Token` | one session |
| GET | `/api/stats` | `X-Admin-Token` | quality dashboard counts |
| DELETE | `/api/sessions/{id}` | `X-Admin-Token` | delete (GDPR withdraw) |

## Run
```bash
export SUPABASE_DB_URL="jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require"
export SUPABASE_DB_USER="postgres"
export SUPABASE_DB_PASSWORD="<db-password>"       # Project Settings -> Database
export NCID_ADMIN_TOKEN="choose-a-long-secret"    # protects read endpoints
export NCID_ALLOWED_ORIGINS="https://arditceno.github.io"

cd backend
./mvnw spring-boot:run           # or: mvn spring-boot:run
```
The `sessions` table is created automatically on startup (`schema.sql`).

## Docker / hosting
```bash
docker build -t ncid-backend .
docker run -p 8080:8080 -e SUPABASE_DB_URL=... -e SUPABASE_DB_USER=... \
  -e SUPABASE_DB_PASSWORD=... -e NCID_ADMIN_TOKEN=... ncid-backend
```
Deploy on Render / Railway / Fly.io and set the same environment variables.

## Where Supabase comes in
- **Database**: Supabase Postgres (connection string above). EU region for GDPR.
- **Read the data**: `GET /api/sessions` (with the admin token), the Supabase
  Table Editor, or the Python fetcher `../analysis/fetch_supabase.py`.
