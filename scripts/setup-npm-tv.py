#!/usr/bin/env python3
"""
Automated Nginx Proxy Manager (NPM) & Let's Encrypt SSL Provisioner for:
  - https://tv.vndns.net (Dedicated Let's Encrypt ECDSA Certificate via HTTP-01 webroot)
  - https://tv.khoavo.vndns.net (Wildcard *.khoavo.vndns.net Certificate npm-2)
Routes both domains to the KV-TV Store container on 116.118.3.103:3456 with
512MB APK upload support, WebSocket upgrade headers, and HSTS.
"""
import subprocess
import sys

CONNECT_SH = "/mnt/data/Projects/thuevpsgiare/connect.sh"
NPM_DB_PATH = "/opt/dockhand/stacks/nginx-proxy-manager/data/database.sqlite"
NPM_PROXY_DIR = "/opt/dockhand/stacks/nginx-proxy-manager/data/nginx/proxy_host"
FORWARD_HOST = "116.118.3.103"
FORWARD_PORT = 3456


def build_nginx_conf(domain: str, host_id: int, cert_id: int) -> str:
    return f"""# ------------------------------------------------------------
# {domain} (KV-TV Store -> {FORWARD_HOST}:{FORWARD_PORT})
# ------------------------------------------------------------

map $scheme $hsts_header {{
    https   "max-age=63072000; preload";
}}

server {{
  set $forward_scheme http;
  set $server         "{FORWARD_HOST}";
  set $port           {FORWARD_PORT};

  listen 80;
  listen [::]:80;

  listen 443 ssl;
  listen [::]:443 ssl;

  server_name {domain};

  http2 on;

  # Let's Encrypt SSL
  include conf.d/include/letsencrypt-acme-challenge.conf;
  include conf.d/include/ssl-cache.conf;
  include conf.d/include/ssl-ciphers.conf;
  ssl_certificate /etc/letsencrypt/live/npm-{cert_id}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/npm-{cert_id}/privkey.pem;

  # Block Exploits
  include conf.d/include/block-exploits.conf;

  # HSTS
  add_header Strict-Transport-Security $hsts_header always;

  # Force SSL
  set $trust_forwarded_proto "F";
  include conf.d/include/force-ssl.conf;

  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $http_connection;
  proxy_http_version 1.1;

  access_log /data/logs/proxy-host-{host_id}_access.log proxy;
  error_log /data/logs/proxy-host-{host_id}_error.log warn;

  # Allow large Android TV APK & Pre-Set Pack (.zip) uploads + unbuffered APK streaming
  client_max_body_size 512m;
  proxy_buffering off;
  proxy_request_buffering off;
  proxy_read_timeout 300s;
  proxy_send_timeout 300s;

  location / {{
    add_header Strict-Transport-Security $hsts_header always;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    proxy_http_version 1.1;

    # Proxy!
    include conf.d/include/proxy.conf;
  }}

  # Custom
  include /data/nginx/custom/server_proxy[.]conf;
}}
"""


def run_vps(cmd: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run([CONNECT_SH, cmd], capture_output=True, text=True, check=check)


def main():
    print("[NPM] Connecting to thuevpsgiare VPS to configure tv.vndns.net & tv.khoavo.vndns.net...")

    # Step 1: Upsert certificate & proxy_host rows in NPM SQLite database
    db_script = f"""
import sqlite3, datetime, json

con = sqlite3.connect('{NPM_DB_PATH}')
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

# 1. Ensure certificate row for tv.vndns.net exists
cert_row = con.execute(
    "SELECT id FROM certificate WHERE is_deleted=0 AND domain_names LIKE '%\"tv.vndns.net\"%'"
).fetchone()
if cert_row:
    tv_cert_id = cert_row[0]
else:
    max_cert = con.execute("SELECT coalesce(max(id), 0) FROM certificate").fetchone()[0]
    tv_cert_id = max_cert + 1
    expires = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
    con.execute('''
        INSERT INTO certificate (
            id, created_on, modified_on, owner_user_id, is_deleted,
            provider, nice_name, domain_names, expires_on, meta
        ) VALUES (?, ?, ?, 1, 0, 'letsencrypt', 'tv.vndns.net', '["tv.vndns.net"]', ?, '{{"dns_challenge":false}}')
    ''', (tv_cert_id, now, now, expires))

def upsert_proxy_host(domain, cert_id):
    row = con.execute(
        "SELECT id FROM proxy_host WHERE is_deleted=0 AND domain_names LIKE ?",
        (f'%"{{domain}}"%',)
    ).fetchone()
    adv = "client_max_body_size 512m;\\nproxy_buffering off;\\nproxy_request_buffering off;"
    if row:
        hid = row[0]
        con.execute('''
            UPDATE proxy_host
               SET modified_on=?, forward_host=?, forward_port=?, certificate_id=?,
                   ssl_forced=1, block_exploits=1, allow_websocket_upgrade=1,
                   http2_support=1, hsts_enabled=1, enabled=1, advanced_config=?
             WHERE id=?
        ''', (now, '{FORWARD_HOST}', {FORWARD_PORT}, cert_id, adv, hid))
        return hid
    else:
        max_id = con.execute("SELECT coalesce(max(id), 0) FROM proxy_host").fetchone()[0]
        hid = max_id + 1
        con.execute('''
            INSERT INTO proxy_host (
                id, created_on, modified_on, owner_user_id, is_deleted,
                domain_names, forward_host, forward_port, access_list_id,
                certificate_id, ssl_forced, caching_enabled, block_exploits,
                advanced_config, meta, allow_websocket_upgrade, http2_support,
                forward_scheme, enabled, locations, hsts_enabled, hsts_subdomains,
                trust_forwarded_proto
            ) VALUES (
                ?, ?, ?, 1, 0,
                ?, '{FORWARD_HOST}', {FORWARD_PORT}, 0,
                ?, 1, 0, 1,
                ?, '{{"nginx_online": true, "nginx_err": null}}', 1, 1,
                'http', 1, '[]', 1, 0, 0
            )
        ''', (hid, now, now, json.dumps([domain]), cert_id, adv))
        return hid

tv_host_id = upsert_proxy_host('tv.vndns.net', tv_cert_id)
sub_host_id = upsert_proxy_host('tv.khoavo.vndns.net', 2)
con.commit()
print(f"IDS:{{tv_cert_id}}:{{tv_host_id}}:{{sub_host_id}}")
"""
    res = run_vps(f"python3 -c {subprocess.list2cmdline([db_script])}")
    ids_line = [line for line in res.stdout.splitlines() if line.startswith("IDS:")][-1]
    _, tv_cert_id_str, tv_host_id_str, sub_host_id_str = ids_line.split(":")
    tv_cert_id = int(tv_cert_id_str)
    tv_host_id = int(tv_host_id_str)
    sub_host_id = int(sub_host_id_str)
    print(f"[NPM] Database records ready -> tv.vndns.net (host={tv_host_id}, cert=npm-{tv_cert_id}), tv.khoavo.vndns.net (host={sub_host_id}, cert=npm-2)")

    # Step 2: Write initial config for tv.vndns.net (using npm-2 if npm-{tv_cert_id} does not exist yet so port 80 ACME works)
    check_cert = run_vps(
        f"test -f /opt/dockhand/stacks/nginx-proxy-manager/letsencrypt/live/npm-{tv_cert_id}/fullchain.pem && echo EXISTS || echo MISSING"
    )
    has_cert = "EXISTS" in check_cert.stdout

    bootstrap_cert_id = tv_cert_id if has_cert else 2
    tv_conf_bootstrap = build_nginx_conf("tv.vndns.net", tv_host_id, bootstrap_cert_id)
    sub_conf = build_nginx_conf("tv.khoavo.vndns.net", sub_host_id, 2)

    run_vps(f"cat << 'EOF' > {NPM_PROXY_DIR}/{tv_host_id}.conf\n{tv_conf_bootstrap}\nEOF")
    run_vps(f"cat << 'EOF' > {NPM_PROXY_DIR}/{sub_host_id}.conf\n{sub_conf}\nEOF")
    run_vps("docker exec nginx-proxy-manager nginx -t && docker exec nginx-proxy-manager nginx -s reload")

    # Step 3: Request Let's Encrypt certificate for tv.vndns.net if not yet issued
    if not has_cert:
        print(f"[NPM] Requesting Let's Encrypt certificate npm-{tv_cert_id} for tv.vndns.net...")
        certbot_cmd = (
            f"docker exec nginx-proxy-manager certbot certonly --non-interactive "
            f"--cert-name npm-{tv_cert_id} --agree-tos --email vonguyendangkhoa@gmail.com "
            f"--authenticator webroot --webroot-path /data/letsencrypt-acme-challenge "
            f"--preferred-challenges http-01 --config-dir /etc/letsencrypt "
            f"--work-dir /tmp/letsencrypt-lib --logs-dir /data/logs "
            f"--key-type ecdsa --elliptic-curve secp384r1 -d tv.vndns.net"
        )
        cb_res = run_vps(certbot_cmd, check=False)
        print(cb_res.stdout.strip())
        if cb_res.returncode != 0:
            print("[WARN] Certbot output:", cb_res.stderr.strip(), file=sys.stderr)

    # Step 4: Activate final npm-{tv_cert_id} certificate in proxy_host/{tv_host_id}.conf
    verify_cert = run_vps(
        f"test -f /opt/dockhand/stacks/nginx-proxy-manager/letsencrypt/live/npm-{tv_cert_id}/fullchain.pem && echo EXISTS || echo MISSING"
    )
    if "EXISTS" in verify_cert.stdout:
        final_tv_conf = build_nginx_conf("tv.vndns.net", tv_host_id, tv_cert_id)
        run_vps(f"cat << 'EOF' > {NPM_PROXY_DIR}/{tv_host_id}.conf\n{final_tv_conf}\nEOF")
        run_vps("docker exec nginx-proxy-manager nginx -t && docker exec nginx-proxy-manager nginx -s reload")
        print(f"[NPM] ✓ Let's Encrypt SSL active for https://tv.vndns.net (npm-{tv_cert_id}) and https://tv.khoavo.vndns.net (npm-2)!")
    else:
        print("[WARN] Let's Encrypt cert file not found; keeping fallback certificate.", file=sys.stderr)


if __name__ == "__main__":
    main()
