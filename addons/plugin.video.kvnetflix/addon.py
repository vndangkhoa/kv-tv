# -*- coding: utf-8 -*-
"""
KV-Netflix Kodi Video Addon
Author: KV-TV
Version: 1.0.0
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

ADDON_ID = 'plugin.video.kvnetflix'
ADDON = xbmcaddon.Addon(id=ADDON_ID)
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_PATH = ADDON.getAddonInfo('path')
ADDON_ICON = os.path.join(ADDON_PATH, 'icon.png')
ADDON_FANART = os.path.join(ADDON_PATH, 'fanart.jpg')

API_BASE = 'https://nf.khoavo.myds.me'
STREAM_PROXY = 'https://nf.khoavo.myds.me/api/stream?url='

USER_AGENT = 'KV-Netflix-Kodi/1.0.0 (Kodi Omega)'


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
        with urllib.request.urlopen(req, timeout=timeout) as response:
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
        # Fallback to legacy setInfo
        item.setInfo('video', info)


def build_url(base_url, params):
    """Build a plugin:// url from parameters dict."""
    return f"{base_url}?{urllib.parse.urlencode(params)}"


# ---------------------------------------------------------------------------
# View Handlers
# ---------------------------------------------------------------------------

def show_main_menu(base_url, handle):
    """Display the top-level main menu."""
    xbmcplugin.setContent(handle, 'videos')

    menu_items = [
        {
            'title': '★ Top Movies',
            'params': {'action': 'catalog', 'category': 'movies', 'label': 'Top Movies'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        },
        {
            'title': '★ New Releases',
            'params': {'action': 'catalog', 'category': 'home', 'label': 'New Releases'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        },
        {
            'title': '★ Featured Series',
            'params': {'action': 'catalog', 'category': 'series', 'label': 'Featured Series'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        },
        {
            'title': '★ Genres',
            'params': {'action': 'genres'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        },
        {
            'title': '★ Search Movies',
            'params': {'action': 'search_prompt'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        },
        {
            'title': '★ Settings',
            'params': {'action': 'settings'},
            'icon': ADDON_ICON,
            'fanart': ADDON_FANART
        }
    ]

    for item in menu_items:
        li = xbmcgui.ListItem(label=item['title'])
        li.setArt({
            'icon': item['icon'],
            'thumb': item['icon'],
            'fanart': item['fanart']
        })
        url = build_url(base_url, item['params'])
        xbmcplugin.addDirectoryItem(handle, url, li, isFolder=True)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def show_genres(base_url, handle):
    """Display available genres dynamically fetched from backend."""
    xbmcplugin.setContent(handle, 'genres')

    genres_url = f"{API_BASE}/api/categories/genres"
    genres = http_get_json(genres_url)

    # Fallback to standard genres if offline / network error
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

    for g in genres:
        name = g.get('Name') or g.get('name') or 'Unknown'
        slug = g.get('Slug') or g.get('slug') or ''
        if not slug:
            continue

        li = xbmcgui.ListItem(label=f"★ {name}")
        li.setArt({
            'icon': ADDON_ICON,
            'thumb': ADDON_ICON,
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
    page_str = params.get('page', ['1'])[0]
    try:
        page = int(page_str)
    except ValueError:
        page = 1

    # Form URL
    if category in ('home', 'movies'):
        api_url = f"{API_BASE}/api/videos/home?page={page}"
    else:
        api_url = f"{API_BASE}/api/videos/home?category={category}&page={page}"

    movies = http_get_json(api_url)

    if not movies or not isinstance(movies, list):
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, f"No titles found for {label}", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=True)
        return

    for m in movies:
        title = m.get('title') or m.get('originalTitle') or 'Untitled'
        year = m.get('year') or 0
        slug = m.get('slug') or m.get('id')
        if not slug:
            continue

        thumb = m.get('thumbnail') or ADDON_ICON
        backdrop = m.get('backdrop') or ADDON_FANART
        quality = m.get('quality', '')
        lang = m.get('lang', '')

        # Display label decoration
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

    # Add Next Page button if we received items
    if len(movies) >= 10:
        next_li = xbmcgui.ListItem(label=f"Next Page (Page {page + 1}) >>")
        next_li.setArt({
            'icon': ADDON_ICON,
            'thumb': ADDON_ICON,
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
        backdrop = m.get('backdrop') or ADDON_FANART
        quality = m.get('quality', '')
        lang = m.get('lang', '')

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

    if not episodes:
        dialog = xbmcgui.Dialog()
        dialog.notification(ADDON_NAME, "No playable streams found", ADDON_ICON, 3000)
        xbmcplugin.endOfDirectory(handle, succeeded=True)
        return

    for ep in episodes:
        ep_num = ep.get('number', 1)
        ep_title = ep.get('title') or f"Episode {ep_num}"
        ep_url = ep.get('url', '')
        server = ep.get('serverName', '')

        if not ep_url:
            continue

        label = f"★ {ep_title}"
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

        # Mark as playable item
        li.setProperty('IsPlayable', 'true')

        play_url = build_url(base_url, {
            'action': 'play',
            'stream_url': ep_url,
            'title': f"{title} - {ep_title}",
            'thumb': thumb,
            'fanart': backdrop
        })

        xbmcplugin.addDirectoryItem(handle, play_url, li, isFolder=False)

    xbmcplugin.endOfDirectory(handle, succeeded=True)


def play_video(handle, params):
    """Resolve stream URL via proxy or direct URL and start playback."""
    stream_url = params.get('stream_url', [''])[0]
    title = params.get('title', ['Stream'])[0]
    thumb = params.get('thumb', [''])[0]
    fanart = params.get('fanart', [''])[0]

    if not stream_url:
        log("No stream_url specified", xbmc.LOGERROR)
        xbmcplugin.setResolvedUrl(handle, False, xbmcgui.ListItem())
        return

    try:
        raw_val = ADDON.getSetting('use_stream_proxy')
        use_proxy = (raw_val.lower() == 'true') if raw_val else True
    except Exception:
        use_proxy = True

    # Build resolved streaming path
    if use_proxy:
        # Pass encoded stream url through KV proxy
        resolved_url = f"{STREAM_PROXY}{urllib.parse.quote(stream_url, safe='')}"
    else:
        resolved_url = stream_url

    log(f"Playing video: '{title}' -> Resolved URL: {resolved_url}")

    play_item = xbmcgui.ListItem(path=resolved_url)
    play_item.setArt({
        'icon': thumb or ADDON_ICON,
        'thumb': thumb or ADDON_ICON,
        'fanart': fanart or ADDON_FANART
    })

    info = {
        'title': title,
        'mediatype': 'video'
    }
    set_item_video_info(play_item, info)

    # Configure adaptive streaming properties
    play_item.setProperty('IsPlayable', 'true')
    play_item.setProperty('inputstream', 'inputstream.adaptive')
    play_item.setProperty('inputstream.adaptive.manifest_type', 'hls')
    play_item.setMimeType('application/vnd.apple.mpegurl')
    play_item.setContentLookup(False)

    xbmcplugin.setResolvedUrl(handle, succeeded=True, listitem=play_item)


# ---------------------------------------------------------------------------
# Main Router
# ---------------------------------------------------------------------------

def run():
    try:
        import xbmcvfs, shutil
        src = xbmcvfs.translatePath('special://logpath/kodi.log')
        dst = '/storage/emulated/0/Download/kodi.log'
        xbmcvfs.copy(src, dst)
    except Exception as e:
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
    elif action == 'settings':
        ADDON.openSettings()
    else:
        log(f"Unknown action: {action}", xbmc.LOGWARNING)
        show_main_menu(base_url, handle)


if __name__ == '__main__':
    run()
