# Stage 1: Build
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Runtime
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/package.json .
COPY --from=build /app/scripts scripts/
COPY --from=build /app/drizzle drizzle/
COPY --from=build /app/drizzle.config.ts .

# Data directory for SQLite (mount as volume)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000
ENV PORT=3000
ENV DATABASE_PATH=/app/data/chapel.db

EXPOSE 3000

CMD ["node", "build"]
