import { useEffect } from 'react';

const FOCUS_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]), a[href]:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex="0"]:not([disabled])';

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getScopeContainer(): HTMLElement | Document {
  const openDialog = document.querySelector('dialog[open]');
  if (openDialog instanceof HTMLElement) return openDialog;
  return document;
}

function findNextCandidate(current: HTMLElement, dir: 'up' | 'down' | 'left' | 'right'): HTMLElement | null {
  const scope = getScopeContainer();
  const candidates = Array.from(scope.querySelectorAll<HTMLElement>(FOCUS_SELECTOR)).filter(
    (el) => el !== current && isVisible(el)
  );
  if (candidates.length === 0) return null;

  const cr = current.getBoundingClientRect();
  const cx = cr.left + cr.width / 2;
  const cy = cr.top + cr.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const cand of candidates) {
    const r = cand.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    let inDirection = false;
    let primary = 0;
    let ortho = 0;
    if (dir === 'right') {
      inDirection = dx > 8;
      primary = dx;
      ortho = Math.abs(dy);
    } else if (dir === 'left') {
      inDirection = dx < -8;
      primary = -dx;
      ortho = Math.abs(dy);
    } else if (dir === 'down') {
      inDirection = dy > 8;
      primary = dy;
      ortho = Math.abs(dx);
    } else if (dir === 'up') {
      inDirection = dy < -8;
      primary = -dy;
      ortho = Math.abs(dx);
    }

    if (!inDirection) continue;
    const score = primary + ortho * 2.4;
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

export function useSpatialNav(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextField =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

      if (isTextField && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return;
      }

      let dir: 'up' | 'down' | 'left' | 'right' | null = null;
      if (e.key === 'ArrowUp') dir = 'up';
      else if (e.key === 'ArrowDown') dir = 'down';
      else if (e.key === 'ArrowLeft') dir = 'left';
      else if (e.key === 'ArrowRight') dir = 'right';

      if (!dir) return;

      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) {
        const first = getScopeContainer().querySelector<HTMLElement>(FOCUS_SELECTOR);
        if (first && isVisible(first)) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      const next = findNextCandidate(active, dir);
      if (next) {
        e.preventDefault();
        next.focus();
        next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
