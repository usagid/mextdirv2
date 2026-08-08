FROM node:22-bookworm-slim AS base

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack install --global pnpm@10.31.0
WORKDIR /app

FROM base AS build

# Prisma generate needs a datasource URL during the image build; runtime uses the
# PostgreSQL service URL from docker-compose.yml.
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mextdir?schema=public

COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prepare
RUN pnpm build

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server ./server

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:deploy && node .output/server/index.mjs"]
