#!/usr/bin/env bash
# =============================================================================
# KV-TV Store (https://tv.vndns.net) — Deploy, Healthcheck & Auto-Prune Script
# Designed for thuevpsgiare Linux VPS deployments where disk space is precious.
#
# What this script does:
#   1. Ensures host bind-mount folders (./data and ./uploads) exist & backs up store.json
#   2. Records disk & Docker storage usage BEFORE the update
#   3. Builds & restarts the `kv-tv-store` container with zero orphan containers
#   4. Waits for the HTTP healthcheck on port 3456 to pass
#   5. Aggressively prunes dangling/old Docker images, buildx/BuildKit cache,
#      stopped containers, and unused anonymous volumes (while keeping ./data
#      and ./uploads 100% safe on the host filesystem!)
# =============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=================================================================="
echo " KV-TV Store — VPS Deploy & Auto-Prune Utility (tv.vndns.net)"
echo " Directory: $PROJECT_DIR"
echo "=================================================================="

# 1. Ensure persistent host directories exist with correct permissions for node (UID 1000)
mkdir -p "$PROJECT_DIR/data" "$PROJECT_DIR/uploads"
if [ "$(id -u)" -eq 0 ]; then
  chown -R 1000:1000 "$PROJECT_DIR/data" "$PROJECT_DIR/uploads" || true
fi

# Back up store.json before restarting
if [ -f "$PROJECT_DIR/data/store.json" ]; then
  cp -f "$PROJECT_DIR/data/store.json" "$PROJECT_DIR/data/store.json.bak"
  echo "[1/5] Backed up ./data/store.json -> ./data/store.json.bak"
else
  echo "[1/5] Fresh install detected (./data/store.json will be auto-seeded on boot)"
fi

echo ""
echo "[2/5] Disk & Docker storage BEFORE update:"
df -h / | awk 'NR==1 || NR==2 {print "  " $0}'
docker system df || true

echo ""
echo "[3/5] Building & starting kv-tv-store container..."
docker compose up -d --build --remove-orphans

echo ""
echo "[4/5] Verifying KV-TV Store health on http://127.0.0.1:3456/api/catalog ..."
HEALTHY=0
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:3456/api/catalog" >/dev/null 2>&1 || wget -qO- "http://127.0.0.1:3456/api/catalog" >/dev/null 2>&1; then
    HEALTHY=1
    echo "  -> KV-TV Store is ONLINE and responding (attempt ${i}/20)."
    break
  fi
  sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "  [!] Warning: Healthcheck did not respond within 20s. Checking container logs:"
  docker compose logs --tail=30
  exit 1
fi

echo ""
echo "[5/5] Aggressively pruning unused Docker images, BuildKit cache & volumes..."
echo "      (Note: Host bind-mounts ./data and ./uploads are NEVER touched by Docker prune)"
docker container prune -f
docker image prune -af
docker builder prune -af
docker volume prune -f

echo ""
echo "=================================================================="
echo " Deploy & Prune Complete! Disk & Docker storage AFTER cleanup:"
echo "=================================================================="
df -h / | awk 'NR==1 || NR==2 {print "  " $0}'
docker system df || true
echo ""
echo " -> Public TV & Promo Portal : https://tv.vndns.net"
echo " -> Local Container Port     : http://127.0.0.1:3456"
echo " -> Admin Console (2FA)      : https://tv.vndns.net/admin"
echo "=================================================================="
