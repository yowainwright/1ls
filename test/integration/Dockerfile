FROM oven/bun:1.1.38-alpine

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

RUN bun run build

COPY test/integration ./test/integration
COPY test/fixtures ./test/fixtures

CMD ["bun", "test", "test/integration/"]
