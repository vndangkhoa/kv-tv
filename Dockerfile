FROM node:20-alpine

LABEL maintainer="KV-TV Store <admin@tv.vndns.net>"
LABEL description="KV-TV Android TV App Store, Pre-Set Media APK Hub & Admin Portal (https://tv.vndns.net)"

WORKDIR /app

# Install production dependencies first (cached layer unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy application source
COPY server.js interface-server.js ./
COPY lib ./lib
COPY public ./public
COPY addons ./addons

# Create persistent directories for bind mounts
# /app/data    -> store.json (catalog, analytics, 2FA secret, ads)
# /app/uploads -> .apk binaries and .zip pre-set configuration packs
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3456
ENV TZ=Asia/Ho_Chi_Minh

VOLUME ["/app/data", "/app/uploads"]

EXPOSE 3456

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3456/api/catalog?track=0').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
