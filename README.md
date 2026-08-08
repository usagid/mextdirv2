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
```

The app is available at `http://localhost:3000/ja/`. Locale routes are `/ja/...`, `/en/...`, `/zh/...`, and `/ko/...`. The Compose app container applies migrations on startup; the seed command is intentionally manual so restarts do not overwrite listings.

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
ADMIN_API_KEY="a-long-random-server-only-key"
DEMO_MODE="false"
STORAGE_DRIVER="local"
```

`ADMIN_API_KEY` protects `POST /api/schools` and `POST /api/schools/:schoolId/images`. It is accepted as `Authorization: Bearer ...` or `x-admin-key: ...` and is never exposed through public runtime config.

## API

- `GET /api/schools?prefecture=長野県&floorAreaMin=1000&sort=floor-desc&page=1`
- `GET /api/schools/:schoolId`
- `POST /api/schools` — admin; JSON body follows `prisma/schema.prisma`
- `POST /api/schools/:schoolId/images` — admin; multipart fields `file`/`files`, optional `altText`, or JSON `{ "url": "/uploads/example.jpg" }`
- `GET /api/prefectures`

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

Local uploads are validated as JPEG, PNG, WebP, GIF, or SVG, capped at 10 MB, written to `public/uploads` during local development or `.output/public/uploads` in the production Compose container, and stored in PostgreSQL as `/uploads/<filename>` paths. The checked-in SVGs are only demo art; real uploads are ignored by Git.

For S3-compatible storage (S3, R2, MinIO, etc.), keep the API and `Image` schema unchanged: replace `saveLocalImage` in `server/utils/storage.ts` with an S3 `PutObject` call, return the public object URL, and set `STORAGE_DRIVER` to a provider value. Add the provider's server-only credentials to runtime config/your deployment secret store. Do not put access keys in `app.config.ts` or client code.

## Adding translations

Add keys to all four JSON files in `locales/` (`ja.json`, `en.json`, `zh.json`, `ko.json`). Keep `㎡` in area labels and values so the unit stays consistent across locales. UI strings use `$t()`/`useI18n()`; listing content remains the source text entered by the lister.

## Project layout

```text
app/
  pages/                 # Home, listing grid, detail, about
  components/            # Brutalist UI and gallery pieces
  layouts/               # Header/footer shell
  assets/css/            # Tailwind entry + base design tokens
locales/                 # Four locale JSON files
server/api/              # Nitro API endpoints
server/utils/            # Prisma, validation, auth, local storage, demo repository
prisma/                  # Schema, migration, and seed
public/uploads/          # Local image storage and demo SVGs
shared/types/            # API/domain types shared by app and server
```
