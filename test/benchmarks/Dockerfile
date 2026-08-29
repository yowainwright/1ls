FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    jq \
    bc \
    && rm -rf /var/lib/apt/lists/*

ARG TARGETARCH
RUN ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "arm64" || echo "amd64") && \
    curl -fsSL "https://github.com/antonmedv/fx/releases/latest/download/fx_linux_${ARCH}" -o /usr/local/bin/fx && \
    chmod +x /usr/local/bin/fx

WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN jq 'del(.workspaces) | del(.scripts.prepare)' package.json > package.tmp.json && \
    mv package.tmp.json package.json && \
    corepack enable && pnpm install --ignore-scripts --no-frozen-lockfile && pnpm run build

COPY test/benchmarks/run.sh /app/test/benchmarks/
RUN chmod +x /app/test/benchmarks/run.sh

ENTRYPOINT ["/app/test/benchmarks/run.sh"]
