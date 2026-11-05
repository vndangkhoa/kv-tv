# KV-TV Store (`tv.vndns.net`)

**KV-TV Store** is a 10-foot Android TV App Store, Pre-Configured Media APK Hub, Phone/Desktop Promotional Portal, and RFC 6238 TOTP 2FA Admin Console built in the canonical **`kv-tv-theme`** (Metro Typographic Panorama) design system.

- **Production URL**: [https://tv.vndns.net](https://tv.vndns.net) (and [https://tv.khoavo.vndns.net](https://tv.khoavo.vndns.net))
- **Phone & Promo Hub**: [https://tv.vndns.net/?mode=promo](https://tv.vndns.net/?mode=promo)
- **Admin & 2FA Console**: [https://tv.vndns.net/admin](https://tv.vndns.net/admin)
- **Docker Hub Image**: `vndangkhoa/kv-tv:latest`

---

## Signature Pre-Configured Android TV Builds (`88101`–`88105`)

| Short-Code | Application | Edition & Pre-Set Optimizations | Direct Short-Code Redirect |
| :--- | :--- | :--- | :--- |
| **`88101`** | **Jellyfin TV** | KV-Optimized Edition · Direct-Play 4K HEVC/HDR10, ExoPlayer buffer tuning, Vietnamese/English subtitle fallback | `https://tv.vndns.net/go/88101` |
| **`88102`** | **Kodi 21 Omega** | KV-Build All-in-One · Arctic Zephyr 2 10-foot skin, 512MB RAM cache, OpenSubtitles + Subscene VN | `https://tv.vndns.net/go/88102` |
| **`88103`** | **CloudStream 3** | KV-PreSetup (Full Repos) · MegaRepo + VN HD Movie/Anime extensions, Cloudflare `1.1.1.1` DoH | `https://tv.vndns.net/go/88103` |
| **`88104`** | **KV-Netflix** | TV Remote & 4K HDR Mod · Native D-Pad focus rings, Widevine L1/L3 adaptive bitrate, no air-mouse required | `https://tv.vndns.net/go/88104` |
| **`88105`** | **KV-Tube** | Ad-Free 4K60 + SponsorBlock · Hardware VP9/AV1 decoding, Return YouTube Dislike, voice search | `https://tv.vndns.net/go/88105` |

---

## Architecture & Zero-Rebuild Docker Persistence

- **Pure `#000000` OLED Canvas & `kv-tv-theme`**:
  - Zero-radius (`0px`) solid color Live Tiles (`#0078D7` Cobalt, `#6B21A8` Violet, `#008272` Teal, `#D83B01` Crimson, `#B91C1C` Vermilion, `#107C10` Emerald, `#B45309` Amber) with `4px solid #FFFFFF` 10-foot D-Pad focus outlines.
  - Full specification in [`DESIGN.md`](./DESIGN.md), [`.impeccable/design.json`](./.impeccable/design.json), and [`docs/KV_TV_THEME_PLAYBOOK.md`](./docs/KV_TV_THEME_PLAYBOOK.md).
- **Persistent Host Bind-Mounts (`./data` & `./uploads`)**:
  - Uploading new `.apk` binaries or `.zip` pre-set configuration packs in `/admin` writes directly to `/opt/dockhand/stacks/kv-tv/uploads` and `/opt/dockhand/stacks/kv-tv/data/store.json` on the VPS host—**never requiring a Docker image rebuild**.

---

## Quick Start & Automated Multi-Git + VPS Rollout

### 1. Run Locally
```bash
npm install
npm start
# Open http://localhost:3456
```

### 2. One-Command Multi-Git Push + Docker Build + VPS Deploy + Prune
```bash
./scripts/push-and-deploy.sh "feat: update catalog or UI"
```
This script automatically:
1. Commits & pushes `main` to:
   - **GitHub**: `https://github.com/vndangkhoa/kv-tv`
   - **Forgejo**: `https://git.khoavo.myds.me/vndangkhoa/kv-tv`
   - **GitLab**: `https://gitlab.khoavo.myds.me/vndangkhoa/kv-tv`
2. Builds and pushes `vndangkhoa/kv-tv:latest` to Docker Hub.
3. Deploys the container to the `thuevpsgiare` VPS (`/opt/dockhand/stacks/kv-tv`), preserves `./data` and `./uploads`, verifies Nginx Proxy Manager (`https://tv.vndns.net`), and prunes unused Docker layers/cache (`docker image prune -f && docker builder prune -f`).
