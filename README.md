<p align="center">
  <img src="./docs/mext_readme_logo.png">
</p>

## Local setup

Requirements: Node 20+, pnpm 10+, and Docker (optional, for PostgreSQL).

```bash
cp .env.example .env
pnpm install

# Option A: use the included read-only demo data; no database is needed.
pnpm dev

# Option B: run PostgreSQL and use Prisma.
docker compose up -d
pnpm db:deploy
pnpm db:seed
# set DEMO_MODE=false in .env before starting the app
pnpm dev

# Option C: build and run both PostgreSQL and mextdir in Docker.
docker compose up --build -d
docker compose exec mextdir pnpm db:seed

# Option D: dev Nuxt + PostgreSQL + MinIO S3-compatible storage.
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml exec mextdir pnpm db:seed
```

After PostgreSQL is migrated, open `/admin/setup` once to create the first administrator. The production Compose app is available at `http://localhost:3000/ja/`. The dev Compose app is available at `http://localhost:3001/ja/`; MinIO's S3 API is `http://localhost:9002` and its console is `http://localhost:9003` (`minioadmin` / `minioadmin`). Locale routes are `/ja/...`, `/en/...`, `/zh/...`, and `/ko/...`. Compose app containers apply migrations on startup; seed commands are intentionally manual so restarts do not overwrite listings.

`DEMO_MODE=true` (or an absent `DATABASE_URL`) serves eight in-memory mock schools so the UI can be previewed without a database. Demo mode is read-only. Set `DEMO_MODE=false` to use PostgreSQL for API writes.

## Commands

| Command           | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `pnpm dev`        | Start Nuxt in development                       |
| `pnpm build`      | Build the Nitro app                             |
| `pnpm preview`    | Preview a production build                      |
| `pnpm typecheck`  | Run Nuxt/Vue TypeScript checks                  |
| `pnpm db:deploy`  | Apply committed migrations                      |
| `pnpm db:migrate` | Create/apply a local development migration      |
| `pnpm db:seed`    | Insert the eight mock schools and image records |
| `pnpm db:studio`  | Open Prisma Studio                              |

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mextdir?schema=public"
# Optional legacy API key; dashboard sessions and generated keys are preferred.
ADMIN_API_KEY="a-long-random-server-only-key"
TRUST_PROXY="false"
DEMO_MODE="false"
STORAGE_DRIVER="local"

# Required when STORAGE_DRIVER="s3".
S3_ENDPOINT="http://localhost:9002"
S3_REGION="us-east-1"
S3_BUCKET="mextdir"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_PUBLIC_URL="http://localhost:9002/mextdir"
S3_FORCE_PATH_STYLE="true"
```

## Admin

Use `/admin/setup` for the one-time first-admin setup, then `/admin` to log in. Passwords are stored as salted scrypt hashes. The first administrator can create additional administrators or editors, correct and add schools, create/revoke API keys, and manage contact-visibility blocks. Generated API keys are shown only once and are accepted as `Authorization: Bearer ...`, `x-api-key: ...`, or `x-admin-key: ...`.

A block matches an exact IP address, a case-insensitive user-agent substring, or both when both fields are set. Blocked public requests still receive listings, but phone and additional-contact fields are blank. Set `TRUST_PROXY=true` only when a trusted reverse proxy controls `X-Forwarded-For`.

The optional `ADMIN_API_KEY` remains a server-only legacy key for `POST /api/schools` and `POST /api/schools/:schoolId/images`; it is never exposed through public runtime config.

## API

- `GET /api/schools?prefecture=長野県&floorAreaMin=1000&sort=floor-desc&page=1`
- `GET /api/schools/:schoolId`
- `POST /api/schools` — admin; JSON body follows `prisma/schema.prisma`
- `POST /api/schools/:schoolId/images` — admin; multipart fields `file`/`files`, optional `altText`, or JSON `{ "url": "/uploads/example.jpg" }`
- `GET /api/prefectures`
- `GET /api/cities?prefecture=長野県`

Example listing creation:

```bash
curl -X POST http://localhost:3000/api/schools \
  -H 'content-type: application/json' \
  -H 'x-admin-key: a-long-random-server-only-key' \
  -d '{
    "prefecture": "長野県",
    "city": "長野市",
    "schoolName": "新しい学校",
    "address": "長野県長野市…",
    "closestPoi": "駅から徒歩10分",
    "lister": "地域振興課",
    "phoneNumber": "026-000-0000",
    "additionalContact": "hello@example.jp",
    "zoningInfo": "都市計画区域外",
    "landInfo": "敷地 約4,000㎡",
    "structureInfo": "木造",
    "completionInfo": "1970年竣工",
    "facilityInfo": "小学校 / 体育館",
    "buildingArea": 1000,
    "floorArea": 1800,
    "floorNum": 2,
    "recruitment": "新しい使い方を募集",
    "conditions": "要相談",
    "remarks": "現地確認可"
  }'
```

Upload a local image after creating a listing:

```bash
curl -X POST http://localhost:3000/api/schools/SCHOOL_ID/images \
  -H 'x-admin-key: a-long-random-server-only-key' \
  -F 'files=@./school.jpg' \
  -F 'altText=校舎正面'
```

## Image storage

Uploads accept JPEG, PNG, WebP, GIF, and SVG up to 10 MB. Set `STORAGE_DRIVER=local` to write files to `public/uploads` during local development or `.output/public/uploads` in the production Compose container. Set `STORAGE_DRIVER=s3` to upload through the AWS SDK S3 client to any S3-compatible endpoint; PostgreSQL still stores only the returned public URL. The checked-in SVGs are demo art; real local uploads are ignored by Git.

S3 mode requires `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL`. `S3_FORCE_PATH_STYLE=true` is useful for MinIO and other local S3-compatible services. The dev Compose file provisions MinIO, creates the `mextdir` bucket, enables anonymous object downloads, and points the app at the host-visible public URL. For production S3/R2/MinIO, keep credentials server-only and make the bucket or CDN URL represented by `S3_PUBLIC_URL` readable by the browser; do not put access keys in `app.config.ts` or client code.

## Adding translations

Add keys to all four JSON files in `locales/` (`ja.json`, `en.json`, `zh.json`, `ko.json`). Keep `㎡` in area labels and values so the unit stays consistent across locales. UI strings use `$t()`/`useI18n()`; listing content remains the source text entered by the lister.
