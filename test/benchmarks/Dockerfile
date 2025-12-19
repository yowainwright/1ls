FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    jq \
    bc \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

ARG TARGETARCH
RUN ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "arm64" || echo "amd64") && \
    curl -fsSL "https://github.com/antonmedv/fx/releases/latest/download/fx_linux_${ARCH}" -o /usr/local/bin/fx && \
    chmod +x /usr/local/bin/fx

WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN jq 'del(.workspaces) | del(.scripts.prepare)' package.json > package.tmp.json && \
    mv package.tmp.json package.json && \
    bun install --no-save && bun run build

COPY test/benchmarks/run.sh /app/test/benchmarks/
RUN chmod +x /app/test/benchmarks/run.sh

ENTRYPOINT ["/app/test/benchmarks/run.sh"]
