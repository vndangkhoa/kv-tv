# -*- coding: utf-8 -*-
"""
KV-Netflix Kodi Video Addon
Author: KV-TV
Version: 1.1.0
Compatibility: Python 3, Kodi 20 Nexus / Kodi 21 Omega
"""

import sys
import os
import re
import html
import json
import urllib.parse
import urllib.request
import urllib.error

import xbmc
import xbmcgui
import xbmcplugin
import xbmcaddon

import service

ADDON_ID = 'plugin.video.kvnetflix'
ADDON = xbmcaddon.Addon(id=ADDON_ID)
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_PATH = ADDON.getAddonInfo('path')
ICONS_DIR = os.path.join(ADDON_PATH, 'resources', 'icons')
ADDON_LOGO = os.path.join(ICONS_DIR, 'logo.png')
ADDON_BACKDROP = os.path.join(ICONS_DIR, 'backdrop.jpg')
ADDON_ICON = ADDON_LOGO if os.path.exists(ADDON_LOGO) else os.path.join(ADDON_PATH, 'icon.png')
ADDON_FANART = ADDON_BACKDROP if os.path.exists(ADDON_BACKDROP) else os.path.join(ADDON_PATH, 'fanart.jpg')

API_BASE = 'https://nf.khoavo.myds.me'
USER_AGENT = 'KV-Netflix-Kodi/1.1.0 (Kodi Omega)'


def log(msg, level=xbmc.LOGINFO):
    xbmc.log(f"[{ADDON_ID}] {msg}", level)


def http_get_json(url, timeout=15):
    """Fetch JSON from URL with timeout and custom User-Agent."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        )
        with urllib.request.urlopen(req, timeout=timeout, context=service.SSL_CTX) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except urllib.error.HTTPError as e:
        log(f"HTTPError {e.code} for URL: {url}", xbmc.LOGERROR)
        return None
    except Exception as e:
        log(f"Request error for URL {url}: {e}", xbmc.LOGERROR)
        return None


def clean_html(raw_html):
    """Clean HTML tags and unescape entities for display in Kodi plot."""
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()


def parse_duration_seconds(duration_val):
    """Convert minutes string or int to seconds for Kodi duration."""
    if not duration_val:
        return 0
    if isinstance(duration_val, (int, float)) and duration_val > 0:
        return int(duration_val * 60)
    text = str(duration_val).lower()
    match = re.search(r'(\d+)\s*(?:phút|min|m)', text)
    if match:
        return int(match.group(1)) * 60
    return 0


def set_item_video_info(item, info):
    """Set video info using modern InfoTag if available, with fallback to setInfo."""
    try:
        tag = item.getVideoInfoTag()
        if 'title' in info and info['title']:
            tag.setTitle(str(info['title']))
        if 'plot' in info and info['plot']:
            tag.setPlot(str(info['plot']))
        if 'year' in info and info['year']:
            try:
                tag.setYear(int(info['year']))
            except (ValueError, TypeError):
                pass
        if 'duration' in info and info['duration']:
            try:
                tag.setDuration(int(info['duration']))
            except (ValueError, TypeError):
                pass
        if 'genre' in info and info['genre']:
            tag.setGenres([str(info['genre'])])
        if 'mediatype' in info and info['mediatype']:
            tag.setMediaType(str(info['mediatype']))
    except Exception:
        item.setInfo('video', info)


def build_url(base_url, params):
    """Build a plugin:// url from parameters dict."""
    return f"{base_url}?{urllib.parse.urlencode(params)}"


def extract_subtitle_urls(detail):
    """Extract absolute subtitle URLs from a video detail dictionary."""
    subs = []
    for s in (detail or {}).get('subtitles') or []:
        u = s.get('url') or ''
        if not u:
            continue
        if u.startswith('/'):
            u = f"{API_BASE}{u}"
        subs.append(u)
    return subs


# ---------------------------------------------------------------------------
# View Handlers
# ---------------------------------------------------------------------------

def show_main_menu(base_url, handle):
    """Display the top-level main menu with custom category icons."""
    xbmcplugin.setContent(handle, 'videos')

    menu_items = [
        {
            'title': 'Top Movies',
            'params': {'action': 'catalog', 'category': 'movies', 'label': 'Top Movies'},
            'icon': os.path.join(ICONS_DIR, 'top_movies.png'),
            'fanart': ADDON_FANART,
            'is_folder': True,
            'plot': 'Browse top trending feature films and blockbusters on KV-Netflix.'
        },
        {
            'title': 'New Releases',
            'params': {'action': 'catalog', 'category': 'home', 'label': 'New Releases'},
            'icon': os.path.join(ICONS_DIR, 'new_releases.png'),
            'fanart': ADDON_FANART,
            'is_folder': True,
            'plot': 'Watch the latest movies and newly added episodes updated daily.'
        },
        {
            'title': 'Featured Series',
            'params': {'action': 'catalog', 'category': 'series', 'label': 'Featured Series'},
            'icon': os.path.join(ICONS_DIR, 'series.png'),
            'fanart': ADDON_FANART,
            'is_folder': True,
            'plot': 'Explore binge-worthy Asian dramas, US/UK series, and multi-episode shows.'
        },
        {
            'title': 'Genres',
            'params': {'action': 'genres'},
            'icon': os.path.join(ICONS_DIR, 'genres.png'),
            'fanart': ADDON_FANART,
            'is_folder': True,
            'plot': 'Filter movies and series by genre: Action, Sci-Fi, Horror, Romance, Anime, and more.'
        },
        {
            'title': 'Search Movies',
            'params': {'action': 'search_prompt'},
            'icon': os.path.join(ICONS_DIR, 'search.png'),
            'fanart': ADDON_FANART,
            'is_folder': True,
            'plot': 'Search the KV-Netflix catalog by title, actor, or keyword.'
        },
        {
            'title': 'Settings',
            'params': {'action': 'settings'},
            'icon': os.path.join(ICONS_DIR, 'settings.png'),
            'fanart': ADDON_FANART,
            'is_folder': False,
            'plot': 'Configure KV-Netflix streaming proxy and server settings.'
        }
    ]

    for item in menu_items:
        li = xbmcgui.ListItem(label=item['title'])
        li.setArt({
            'icon': item['icon'],
            'thumb': ADDON_LOGO,
            'fanart': item['fanart']
        })
        set_item_video_info(li, {
            'title': item['title'],
            'plot': item['plot'],
            'mediatype': 'video'
        })
        url = build_url(base_url, item['params'])
        xbmcplugin.addDirectoryItem(handle, url, li, isFolder=item['is_folder'])

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def show_genres(base_url, handle):
    """Display available genres dynamically fetched from backend."""
    xbmcplugin.setContent(handle, 'genres')

    genres_url = f"{API_BASE}/api/categories/genres"
    genres = http_get_json(genres_url)

    if not genres or not isinstance(genres, list):
        genres = [
            {'Name': 'Hành Động', 'Slug': 'hanh-dong'},
            {'Name': 'Cổ Trang', 'Slug': 'co-trang'},
            {'Name': 'Hoạt Hình / Anime', 'Slug': 'hoat-hinh'},
            {'Name': 'Khoa Học Viễn Tưởng', 'Slug': 'khoa-hoc-vien-tuong'},
            {'Name': 'Kinh Dị', 'Slug': 'kinh-di'},
            {'Name': 'Hài', 'Slug': 'hai'},
            {'Name': 'Tình Cảm', 'Slug': 'lang-man'},
            {'Name': 'Bí Ẩn & Giật Gân', 'Slug': 'giat-gan'},
            {'Name': 'Võ Thuật', 'Slug': 'vo-thuat'}
        ]

    genre_icon = os.path.join(ICONS_DIR, 'genres.png')
    for g in genres:
        name = g.get('Name') or g.get('name') or 'Unknown'
        slug = g.get('Slug') or g.get('slug') or ''
        if not slug:
            continue

        li = xbmcgui.ListItem(label=name)
        li.setArt({
            'icon': genre_icon,
            'thumb': ADDON_LOGO,
            'fanart': ADDON_FANART
        })
        url = build_url(base_url, {
            'action': 'catalog',
            'category': slug,
            'label': name,
            'page': 1
        })
        xbmcplugin.addDirectoryItem(handle, url, li, isFolder=True)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def show_catalog(base_url, handle, params):
    """Display catalog listing for a category / genre / home page."""
    xbmcplugin.setContent(handle, 'movies')

    category = params.get('category', ['home'])[0]
    label = params.get('label', ['Movies'])[0]
    is_widget = params.get('widget', ['0'])[0] == '1'
    page_str = params.get('page', ['1'])[0]
    try:
        page = int(page_str)
    except ValueError:
        page = 1

    category_map = {
        'movies': 'phim-le',
        'series': 'phim-bo',
        'tvshows': 'tv-shows',
        'anime': 'hoat-hinh',
    }
    mapped_cat = category_map.get(category, category)
    if category == 'home':
        api_url = f"{API_BASE}/api/videos/home?page={page}"
    else:
        api_url = f"{API_BASE}/api/videos/home?category={mapped_cat}&page={page}"

    movies = http_get_json(api_url)

    if not movies or not isinstance(movies, list):
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, f"No titles found for {label}", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=True)
        return

    dead_slugs = {'cuoc-doi-bi-lay-mat-natalee-holloway', 'anaesthesia-vo-cam', 'thuong-cong-chua'}
    movies = [m for m in movies if (m.get('slug') or m.get('id')) not in dead_slugs]
    if is_widget:
        movies.sort(key=lambda x: (0 if x.get('backdrop') else 1))

    for m in movies:
        title = m.get('title') or m.get('originalTitle') or 'Untitled'
        year = m.get('year') or 0
        slug = m.get('slug') or m.get('id')
        if not slug:
            continue

        thumb = m.get('thumbnail') or ADDON_ICON
        backdrop = m.get('backdrop') or thumb or ADDON_FANART
        quality = m.get('quality', '')
        lang = m.get('lang', '')

        badges = []
        if quality:
            badges.append(quality)
        if lang:
            badges.append(lang)
        if year:
            badges.append(str(year))

        display_label = title
        if badges:
            display_label = f"{title} [{', '.join(badges)}]"

        li = xbmcgui.ListItem(label=display_label)
        li.setArt({
            'icon': thumb,
            'thumb': backdrop or thumb,
            'poster': thumb,
            'fanart': backdrop,
            'landscape': backdrop,
            'banner': backdrop
        })

        plot_text = clean_html(m.get('description', '')) or f"{title} ({year}) - {quality} {lang}".strip()
        info = {
            'title': title,
            'year': year,
            'plot': plot_text,
            'duration': parse_duration_seconds(m.get('time') or m.get('duration')) or 5400,
            'genre': m.get('genre') or label,
            'mediatype': 'movie'
        }
        set_item_video_info(li, info)

        detail_target = build_url(base_url, {
            'action': 'detail',
            'slug': slug,
            'title': title,
            'thumb': thumb,
            'fanart': backdrop
        })

        if is_widget:
            li.setProperty('IsPlayable', 'true')
            li.addContextMenuItems([
                ('Browse Episodes / Servers', f'ActivateWindow(Videos,{detail_target},return)')
            ])
            url = build_url(base_url, {
                'action': 'play_slug',
                'slug': slug,
                'title': title,
                'thumb': thumb,
                'fanart': backdrop
            })
            xbmcplugin.addDirectoryItem(handle, url, li, isFolder=False)
        else:
            xbmcplugin.addDirectoryItem(handle, detail_target, li, isFolder=True)

    if len(movies) >= 10 and not is_widget:
        next_li = xbmcgui.ListItem(label=f"Next Page (Page {page + 1}) >>")
        next_li.setArt({
            'icon': os.path.join(ICONS_DIR, 'new_releases.png'),
            'thumb': ADDON_LOGO,
            'fanart': ADDON_FANART
        })
        next_url = build_url(base_url, {
            'action': 'catalog',
            'category': category,
            'label': label,
            'page': page + 1
        })
        xbmcplugin.addDirectoryItem(handle, next_url, next_li, isFolder=True)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def show_search(base_url, handle, params):
    """Handle search prompt and display search results."""
    query = params.get('q', [''])[0]
    if not query:
        dialog = xbmcgui.Dialog()
        query = dialog.input("Search KV-Netflix Movies & Series", type=xbmcgui.INPUT_ALPHANUM)
        if not query:
            xbmcplugin.endOfDirectory(handle, succeeded=False)
            return

    xbmcplugin.setContent(handle, 'movies')

    search_url = f"{API_BASE}/api/videos/search?q={urllib.parse.quote(query)}"
    results = http_get_json(search_url)

    if not results or not isinstance(results, list):
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, f"No matches found for '{query}'", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=True)
        return

    for m in results:
        title = m.get('title') or m.get('originalTitle') or 'Untitled'
        year = m.get('year') or 0
        slug = m.get('slug') or m.get('id')
        if not slug:
            continue

        thumb = m.get('thumbnail') or ADDON_ICON
        backdrop = m.get('backdrop') or thumb or ADDON_FANART
        quality = m.get('quality', '')

        display_label = title
        if year:
            display_label = f"{display_label} ({year})"
        if quality:
            display_label = f"{display_label} [{quality}]"

        li = xbmcgui.ListItem(label=display_label)
        li.setArt({
            'icon': thumb,
            'thumb': thumb,
            'poster': thumb,
            'fanart': backdrop
        })

        info = {
            'title': title,
            'year': year,
            'plot': clean_html(m.get('description', '')),
            'duration': parse_duration_seconds(m.get('time') or m.get('duration')),
            'mediatype': 'movie'
        }
        set_item_video_info(li, info)

        url = build_url(base_url, {
            'action': 'detail',
            'slug': slug,
            'title': title,
            'thumb': thumb,
            'fanart': backdrop
        })
        xbmcplugin.addDirectoryItem(handle, url, li, isFolder=True)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def show_movie_detail(base_url, handle, params):
    """Fetch movie detail and display playable episodes or direct play."""
    slug = params.get('slug', [''])[0]
    movie_title = params.get('title', ['Movie'])[0]
    movie_thumb = params.get('thumb', [ADDON_ICON])[0]
    movie_fanart = params.get('fanart', [ADDON_FANART])[0]

    if not slug:
        log("No slug provided for movie detail", xbmc.LOGERROR)
        xbmcplugin.endOfDirectory(handle, succeeded=False)
        return

    xbmcplugin.setContent(handle, 'episodes')

    detail_url = f"{API_BASE}/api/videos/{slug}"
    detail = http_get_json(detail_url)

    if not detail or not isinstance(detail, dict):
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, "Failed to load movie details", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=False)
        return

    title = detail.get('title') or movie_title
    plot = clean_html(detail.get('description', ''))
    year = detail.get('year', 0)
    thumb = detail.get('thumbnail') or movie_thumb
    backdrop = detail.get('backdrop') or movie_fanart
    episodes = detail.get('episodes') or []
    subs = extract_subtitle_urls(detail)
    sub_param = subs[0] if subs else ''

    if not episodes:
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, "No playable streams found", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=True)
        return

    for ep in episodes:
        ep_num = ep.get('number', 1)
        ep_title = ep.get('title') or f"Episode {ep_num}"
        ep_url = ep.get('url', '')
        embed_url = ep.get('embedUrl', '')
        server = ep.get('serverName', '')

        if not ep_url:
            continue

        label = ep_title
        if server:
            label = f"{label} ({server})"

        li = xbmcgui.ListItem(label=label)
        li.setArt({
            'icon': thumb,
            'thumb': thumb,
            'poster': thumb,
            'fanart': backdrop
        })

        info = {
            'title': f"{title} - {ep_title}",
            'plot': plot,
            'year': year,
            'mediatype': 'episode' if len(episodes) > 1 else 'movie'
        }
        set_item_video_info(li, info)

        li.setProperty('IsPlayable', 'true')

        play_params = {
            'action': 'play',
            'stream_url': ep_url,
            'embed_url': embed_url,
            'title': f"{title} - {ep_title}",
            'thumb': thumb,
            'fanart': backdrop
        }
        if sub_param:
            play_params['sub_url'] = sub_param

        play_url = build_url(base_url, play_params)
        xbmcplugin.addDirectoryItem(handle, play_url, li, isFolder=False)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def play_video(handle, params):
    """Resolve stream URL via local HLS proxy and start playback."""
    stream_url = params.get('stream_url', [''])[0]
    embed_url = params.get('embed_url', [''])[0]
    sub_url = params.get('sub_url', [''])[0]
    title = params.get('title', ['Stream'])[0]
    thumb = params.get('thumb', [''])[0]
    fanart = params.get('fanart', [''])[0]

    if not stream_url:
        log("No stream_url specified", xbmc.LOGERROR)
        xbmcplugin.setResolvedUrl(handle, False, xbmcgui.ListItem())
        return

    # Ensure local HLS proxy is active to sign VSMOV streams and strip fake PNG headers
    resolved_url = stream_url
    if service.ensure_proxy_running():
        resolved_url = service.build_proxy_play_url(stream_url, embed_url)

    log(f"Playing video: '{title}' (handle={handle}) -> {resolved_url} (upstream={stream_url})")

    play_item = xbmcgui.ListItem(label=title, path=resolved_url)
    play_item.setArt({
        'icon': thumb or ADDON_ICON,
        'thumb': thumb or ADDON_ICON,
        'poster': thumb or ADDON_ICON,
        'fanart': fanart or ADDON_FANART
    })

    info = {
        'title': title,
        'mediatype': 'video'
    }
    set_item_video_info(play_item, info)

    if sub_url:
        play_item.setSubtitles([sub_url])

    play_item.setProperty('IsPlayable', 'true')
    play_item.setMimeType('application/vnd.apple.mpegurl')
    play_item.setContentLookup(False)

    if handle >= 0:
        xbmcplugin.setResolvedUrl(handle, succeeded=True, listitem=play_item)
    else:
        xbmc.Player().play(resolved_url, play_item)


def play_slug(handle, params):
    """Fetch movie detail by slug and immediately play the first available episode/stream."""
    slug = params.get('slug', [''])[0]
    title = params.get('title', ['Movie'])[0]
    thumb = params.get('thumb', [ADDON_ICON])[0]
    fanart = params.get('fanart', [ADDON_FANART])[0]

    if not slug:
        xbmcplugin.setResolvedUrl(handle, False, xbmcgui.ListItem())
        return

    detail = http_get_json(f"{API_BASE}/api/videos/{slug}")
    episodes = (detail or {}).get('episodes') or []
    if not episodes:
        xbmcgui.Dialog().notification(ADDON_NAME, f"No stream found for {title}", ADDON_ICON, 3000)
        xbmcplugin.setResolvedUrl(handle, False, xbmcgui.ListItem())
        return

    subs = extract_subtitle_urls(detail)
    chosen_ep = episodes[0]
    for cand in episodes:
        if cand.get('url'):
            chosen_ep = cand
            break

    play_params = {
        'stream_url': [chosen_ep.get('url', '')],
        'embed_url': [chosen_ep.get('embedUrl', '')],
        'title': [f"{title} - {chosen_ep.get('title') or 'Full'}"],
        'thumb': [(detail or {}).get('thumbnail') or thumb],
        'fanart': [(detail or {}).get('backdrop') or fanart]
    }
    if subs:
        play_params['sub_url'] = [subs[0]]

    play_video(handle, play_params)


# ---------------------------------------------------------------------------
# Main Router
# ---------------------------------------------------------------------------

def clear_stale_addon_textures():
    """One-time cleanup of stale cached kvnetflix textures and directory cache inside Kodi."""
    try:
        import sqlite3
        import xbmcvfs
        flag = xbmcvfs.translatePath('special://userdata/kvnetflix_tex_v113.flag')
        if os.path.exists(flag):
            return
        db_path = xbmcvfs.translatePath('special://userdata/Database/Textures13.db')
        thumbs_dir = xbmcvfs.translatePath('special://userdata/Thumbnails')
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path, timeout=5)
            cur = conn.cursor()
            cur.execute("SELECT id, cachedurl FROM texture WHERE url LIKE '%kvnetflix%'")
            rows = cur.fetchall()
            for tex_id, cachedurl in rows:
                if cachedurl:
                    cached_file = os.path.join(thumbs_dir, cachedurl.replace('/', os.sep).lstrip(os.sep))
                    try:
                        if os.path.exists(cached_file):
                            os.remove(cached_file)
                    except Exception:
                        pass
                cur.execute("DELETE FROM sizes WHERE idtexture = ?", (tex_id,))
                cur.execute("DELETE FROM texture WHERE id = ?", (tex_id,))
            conn.commit()
            conn.close()
        cache_dir = xbmcvfs.translatePath('special://temp/archive_cache')
        if os.path.isdir(cache_dir):
            for fn in os.listdir(cache_dir):
                try:
                    os.remove(os.path.join(cache_dir, fn))
                except Exception:
                    pass
        with open(flag, 'w') as f:
            f.write('ok')
    except Exception as e:
        log(f"Texture cache cleanup note: {e}")


def run():
    clear_stale_addon_textures()
    try:
        import xbmcvfs
        src = xbmcvfs.translatePath('special://logpath/kodi.log')
        dst = '/storage/emulated/0/Download/kodi.log'
        xbmcvfs.copy(src, dst)
    except Exception:
        pass

    base_url = sys.argv[0] if len(sys.argv) > 0 else 'plugin://plugin.video.kvnetflix/'
    handle = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else -1
    query_string = sys.argv[2][1:] if len(sys.argv) > 2 and sys.argv[2].startswith('?') else ''
    params = urllib.parse.parse_qs(query_string)

    action = params.get('action', [None])[0]

    log(f"Router invoked with action='{action}', params={params}")

    if not action:
        show_main_menu(base_url, handle)
    elif action == 'catalog':
        show_catalog(base_url, handle, params)
    elif action == 'genres':
        show_genres(base_url, handle)
    elif action == 'search_prompt' or action == 'search':
        show_search(base_url, handle, params)
    elif action == 'detail':
        show_movie_detail(base_url, handle, params)
    elif action == 'play':
        play_video(handle, params)
    elif action == 'play_slug':
        play_slug(handle, params)
    elif action == 'settings':
        ADDON.openSettings()
    else:
        log(f"Unknown action: {action}", xbmc.LOGWARNING)
        show_main_menu(base_url, handle)


if __name__ == '__main__':
    run()
