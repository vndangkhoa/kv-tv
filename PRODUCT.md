# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
delegated: Node.js (Express/Fastify zero-bloat backend with SQLite/JSON persistent store, RFC 6238 TOTP 2FA, Multer APK streaming) + Vanilla HTML/CSS/JS frontend (zero heavy framework bundle for instant <100ms load on low-RAM Android TV boxes, native `<dialog>`, roving-tabindex 2D spatial D-pad navigation).

## Users
- **TV Viewers (Primary)**: Users in Vietnam and abroad navigating on Android TV boxes, Google TV sticks, and Smart TVs (Sony, TCL, Xiaomi, Nvidia Shield, generic Amlogic/Rockchip boxes) using a directional remote (D-Pad: Up/Down/Left/Right/OK/Back) from 3 meters away (10-foot UI).
- **Mobile & Desktop Visitors**: Prospective users visiting `https://tv.vndns.net` from phones or laptops to discover the KV-TV App Store, view promotional ads/featured apps, scan QR codes, or grab short-codes for their TV.
- **Store Administrator**: The owner hosting on a `thuevpsgiare` VPS who manages APK uploads/removals, pre-configured app bundles, promotional banners, security (Login + 2FA), and download telemetry.

## Product Purpose
Provide a blazing-fast, remote-friendly Android TV App Store and promotional hub at `https://tv.vndns.net` that distributes curated, pre-configured, and optimized media apps (`Jellyfin`, `Kodi`, `CloudStream`, `KV-Netflix`, `KV-Tube`) with one-click APK installation, short-codes, and full admin analytics.

## Positioning
Unlike generic APK mirrors that break on TV browsers, require mouse emulation, or serve unconfigured stock APKs, KV-TV Store combines a true 10-foot D-pad spatial interface with pre-configured ("already setup") media builds and an integrated Admin + Ad portal that runs on a lightweight VPS container.

## Operating Context
- Hosted on a Linux VPS (`thuevpsgiare`) behind Nginx Proxy Manager (NPM) at `https://tv.vndns.net`.
- Accessed via TV WebView wrapper APK, TV browsers (TV Bro, Zeus, Puffin, Downloader by AFTVnews), mobile browsers, and desktop browsers.
- Deployed via Docker with persistent volume mounts (`./data` and `./uploads`) so APK updates happen dynamically via the Admin UI without rebuilding images, paired with automated Docker pruning to conserve VPS disk space.

## Capabilities and Constraints
- **TV Interface**: Big icons, high-contrast 10-foot typography, full D-pad spatial navigation, Downloader numeric short-codes, instant load speed.
- **Pre-Set Optimized Catalog**: Initial curated lineup: `Jellyfin`, `Kodi`, `CloudStream` (pre-configured), `KV-Netflix`, `KV-Tube`.
- **Phone/Desktop Portal**: Responsive promotional landing page with ad banners, install guides, and live catalog preview.
- **Admin Dashboard**: Username/Password + TOTP 2FA login, APK file upload & deletion, pre-config bundle management, ad slot management, and download/visitor tracking.
- **VPS Storage Constraint**: Automated Docker image/build-cache pruning after updates; persistent data stored outside image layers.

## Brand Commitments
- Domain: `https://tv.vndns.net`
- Brand Name: **KV-TV Store** (`kv-tv`)
- Signature Apps: `KV-Netflix`, `KV-Tube`, plus KV-optimized editions of `Jellyfin`, `Kodi`, and `CloudStream`.

## Evidence on Hand
- Pre-seeded metadata and realistic downloadable demo APK/config endpoints for the 5 core apps (`Jellyfin`, `Kodi`, `CloudStream`, `KV-Netflix`, `KV-Tube`) until the administrator uploads production `.apk` binaries via `/admin`.

## Product Principles
1. **10-Foot Remote First**: Every interactive element on the TV view must have an unmistakable focus state and work effortlessly with 5-key D-pad navigation (Up, Down, Left, Right, OK/Enter, Back/Esc).
2. **Zero-Bloat Speed on Budget TV Boxes**: Avoid heavy client-side JS frameworks; deliver inline/critical CSS and semantic HTML so even 1GB RAM Android TV boxes render under 100ms.
3. **Upload Without Rebuild**: Decouple application code (Docker image) from APK binaries and SQLite/JSON state (mounted volumes) so managing apps never triggers a Docker build.
4. **Defense-in-Depth Admin**: Protect APK distribution and catalog management with TOTP 2FA, rate limiting, and audit logs.
