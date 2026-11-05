#!/usr/bin/env bash
# ==============================================================================
# KV-TV Store (https://tv.vndns.net) — Full Rollout Automation Script
# ------------------------------------------------------------------------------
# 1. Ensures Git remotes exist & pushes `main` to:
#      - Forgejo : https://git.khoavo.myds.me/vndangkhoa/kv-tv
#      - GitLab  : https://gitlab.khoavo.myds.me/vndangkhoa/kv-tv
#      - GitHub  : https://github.com/vndangkhoa/kv-tv (git@github.com:vndangkhoa/kv-tv.git)
# 2. Builds & pushes Docker image `vndangkhoa/kv-tv:latest` to Docker Hub.
# 3. Deploys `vndangkhoa/kv-tv:latest` to the thuevpsgiare VPS
#    (`/opt/dockhand/stacks/kv-tv`), preserving `/app/data` & `/app/uploads`.
# 4. Configures Nginx Proxy Manager (NPM) + Let's Encrypt SSL for `https://tv.vndns.net`.
# 5. Prunes dangling Docker images & build cache locally and on the VPS.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONNECT_SH="/mnt/data/Projects/thuevpsgiare/connect.sh"
DOCKER_IMAGE_INTERFACE="vndangkhoa/kv-tv-interface:latest"
DOCKER_IMAGE_BACKEND="vndangkhoa/kv-tv-backend:latest"
COMMIT_MSG="${1:-feat: split Docker images (interface + backend) and enable 1-click VPS download with Forgejo fallback}"

cd "${PROJECT_DIR}"

echo "======================================================================"
echo " [1/5] Preparing Git Repository & Multi-Remote Sync (Forgejo/GitLab/GitHub)"
echo "======================================================================"

if [ ! -d ".git" ]; then
  git init -b main
fi

git config user.name "vndangkhoa"
git config user.email "vonguyendangkhoa@gmail.com"

# Configure remotes
FORGEJO_URL="https://git.khoavo.myds.me/vndangkhoa/kv-tv.git"
GITLAB_URL="https://gitlab.khoavo.myds.me/vndangkhoa/kv-tv.git"
GITHUB_URL="git@github.com:vndangkhoa/kv-tv.git"

git remote get-url origin >/dev/null 2>&1 && git remote set-url origin "${FORGEJO_URL}" || git remote add origin "${FORGEJO_URL}"
git remote get-url forgejo >/dev/null 2>&1 && git remote set-url forgejo "${FORGEJO_URL}" || git remote add forgejo "${FORGEJO_URL}"
git remote get-url gitlab >/dev/null 2>&1 && git remote set-url gitlab "${GITLAB_URL}" || git remote add gitlab "${GITLAB_URL}"
git remote get-url github >/dev/null 2>&1 && git remote set-url github "${GITHUB_URL}" || git remote add github "${GITHUB_URL}"

# Stage & commit changes if working tree is dirty or has no commits yet
git add -A
if ! git rev-parse --verify HEAD >/dev/null 2>&1 || ! git diff --cached --quiet; then
  git commit -m "${COMMIT_MSG}"
  echo "[Git] Committed changes: ${COMMIT_MSG}"
else
  echo "[Git] Working tree clean, no new commit needed."
fi
git branch -M main

# Ensure repository exists on Forgejo (git.khoavo.myds.me)
FORGEJO_TOKEN="$(grep -oP 'https://vndangkhoa:\K[^@]+(?=@git\.khoavo\.myds\.me)' ~/.git-credentials 2>/dev/null | head -n1 || true)"
if [ -n "${FORGEJO_TOKEN}" ]; then
  STATUS="$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token ${FORGEJO_TOKEN}" "https://git.khoavo.myds.me/api/v1/repos/vndangkhoa/kv-tv")"
  if [ "${STATUS}" = "404" ]; then
    echo "[Forgejo] Creating repository vndangkhoa/kv-tv on git.khoavo.myds.me..."
    curl -s -X POST "https://git.khoavo.myds.me/api/v1/user/repos" \
      -H "Authorization: token ${FORGEJO_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"name":"kv-tv","description":"KV-TV Android TV App Store, Pre-Set Media APK Hub & 2FA Admin Console (https://tv.vndns.net)","private":false,"default_branch":"main"}' >/dev/null
  fi
fi

# Ensure repository exists on GitLab (gitlab.khoavo.myds.me)
GITLAB_TOKEN="$(grep -oP 'https://(?:vndangkhoa|oauth2):\K[^@]+(?=@gitlab\.khoavo\.myds\.me)' ~/.git-credentials 2>/dev/null | head -n1 || true)"
if [ -n "${GITLAB_TOKEN}" ]; then
  GL_STATUS="$(curl -s -o /dev/null -w "%{http_code}" -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "https://gitlab.khoavo.myds.me/api/v4/projects/vndangkhoa%2Fkv-tv")"
  if [ "${GL_STATUS}" = "404" ]; then
    echo "[GitLab] Creating project vndangkhoa/kv-tv on gitlab.khoavo.myds.me..."
    curl -s -X POST "https://gitlab.khoavo.myds.me/api/v4/projects" \
      -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"name":"kv-tv","path":"kv-tv","description":"KV-TV Android TV App Store, Pre-Set Media APK Hub & 2FA Admin Console (https://tv.vndns.net)","visibility":"public","initialize_with_readme":false}' >/dev/null
  fi
fi

# Ensure repository exists on GitHub if GITHUB_TOKEN / gh CLI is authenticated
if [ -n "${GITHUB_TOKEN:-}" ]; then
  GH_STATUS="$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${GITHUB_TOKEN}" "https://api.github.com/repos/vndangkhoa/kv-tv")"
  if [ "${GH_STATUS}" = "404" ]; then
    echo "[GitHub] Creating repository vndangkhoa/kv-tv via GITHUB_TOKEN..."
    curl -s -X POST "https://api.github.com/user/repos" \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"name":"kv-tv","description":"KV-TV Android TV App Store, Pre-Set Media APK Hub & 2FA Admin Console (https://tv.vndns.net)","homepage":"https://tv.vndns.net","private":false}' >/dev/null
  fi
elif command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh repo view vndangkhoa/kv-tv >/dev/null 2>&1 || gh repo create vndangkhoa/kv-tv --public --description "KV-TV Android TV App Store, Pre-Set Media APK Hub & 2FA Admin Console (https://tv.vndns.net)" --homepage "https://tv.vndns.net" || true
fi

echo "[Git] Pushing main -> Forgejo (${FORGEJO_URL})..."
git push -u forgejo main

echo "[Git] Pushing main -> GitLab (${GITLAB_URL})..."
git push -u gitlab main

echo "[Git] Pushing main -> GitHub (${GITHUB_URL})..."
if git push -u github main; then
  echo "[Git] ✓ Pushed to GitHub (https://github.com/vndangkhoa/kv-tv)"
else
  echo "[WARN] GitHub push skipped/failed (if repo vndangkhoa/kv-tv is not yet created on github.com, create an empty repo at https://github.com/new named 'kv-tv' or export GITHUB_TOKEN and re-run)."
fi

echo ""
echo "======================================================================"
echo " [2/5] Building & Pushing Split Docker Images"
echo "       - Interface : ${DOCKER_IMAGE_INTERFACE}"
echo "       - Backend   : ${DOCKER_IMAGE_BACKEND}"
echo "======================================================================"
docker build -f Dockerfile.interface -t "${DOCKER_IMAGE_INTERFACE}" .
docker push "${DOCKER_IMAGE_INTERFACE}"
echo "[Docker] ✓ Pushed ${DOCKER_IMAGE_INTERFACE} to Docker Hub"

docker build -f Dockerfile.backend -t "${DOCKER_IMAGE_BACKEND}" .
docker push "${DOCKER_IMAGE_BACKEND}"
echo "[Docker] ✓ Pushed ${DOCKER_IMAGE_BACKEND} to Docker Hub"

echo ""
echo "======================================================================"
echo " [3/5] Deploying Interface + Backend to thuevpsgiare VPS (/opt/dockhand/stacks/kv-tv)"
echo "======================================================================"
"${CONNECT_SH}" "mkdir -p /opt/dockhand/stacks/kv-tv/data /opt/dockhand/stacks/kv-tv/uploads"

if [ -n "${FORGEJO_TOKEN:-}" ]; then
  echo "FORGEJO_TOKEN=${FORGEJO_TOKEN}" | "${CONNECT_SH}" "cat > /opt/dockhand/stacks/kv-tv/.env && chmod 600 /opt/dockhand/stacks/kv-tv/.env"
fi

# Seed initial store.json on VPS only if it does not exist yet (never overwrite live catalog!)
if [ -f "${PROJECT_DIR}/data/store.json" ]; then
  HAS_STORE="$("${CONNECT_SH}" "test -f /opt/dockhand/stacks/kv-tv/data/store.json && echo YES || echo NO")"
  if [[ "${HAS_STORE}" != *"YES"* ]]; then
    echo "[VPS] Seeding initial data/store.json to /opt/dockhand/stacks/kv-tv/data/store.json..."
    cat "${PROJECT_DIR}/data/store.json" | "${CONNECT_SH}" "cat > /opt/dockhand/stacks/kv-tv/data/store.json"
  fi
fi

# Sync VPS stack docker-compose.yml
cat /mnt/data/Projects/thuevpsgiare/stacks/kv-tv/docker-compose.yml | "${CONNECT_SH}" "cat > /opt/dockhand/stacks/kv-tv/docker-compose.yml"

# Pull latest image & restart container on VPS
"${CONNECT_SH}" "cd /opt/dockhand/stacks/kv-tv && docker compose pull && docker compose up -d --remove-orphans"

echo ""
echo "======================================================================"
echo " [4/5] Configuring Nginx Proxy Manager (NPM) for https://tv.vndns.net"
echo "======================================================================"
python3 "${SCRIPT_DIR}/setup-npm-tv.py"

echo ""
echo "======================================================================"
echo " [5/5] Pruning Unused Docker Images & Build Cache (Local + VPS)"
echo "======================================================================"
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f >/dev/null 2>&1 || true
"${CONNECT_SH}" "docker image prune -f && docker builder prune -f && df -h /"

echo ""
echo "======================================================================"
echo " ✓ KV-TV Store Rollout Complete!"
echo "   - Production TV Store : https://tv.vndns.net"
echo "   - Mirror Subdomain    : https://tv.khoavo.vndns.net"
echo "   - Phone & Promo Hub   : https://tv.vndns.net/?mode=promo"
echo "   - Admin 2FA Console   : https://tv.vndns.net/admin"
echo "   - Forgejo             : https://git.khoavo.myds.me/vndangkhoa/kv-tv"
echo "   - GitLab              : https://gitlab.khoavo.myds.me/vndangkhoa/kv-tv"
echo "   - GitHub              : https://github.com/vndangkhoa/kv-tv"
echo "======================================================================"
