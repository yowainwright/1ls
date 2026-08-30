FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json ./app/package.json

RUN apt-get update && apt-get install -y clang && rm -rf /var/lib/apt/lists/*
RUN corepack enable && pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

RUN pnpm run build

COPY test/integration ./test/integration
COPY test/fixtures ./test/fixtures

CMD ["pnpm", "run", "test:integration"]
