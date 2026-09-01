import { useEffect, useState } from 'react';

/** Must match the CSS animation durations below. */
const EXIT_MS = 220;

/**
 * Wraps content that appears and disappears on demand, animating both ways.
 *
 * Entry is a declarative CSS animation that runs on mount, rather than
 * mounting closed and flipping an `is-open` class a frame later via
 * `requestAnimationFrame`. The rAF approach depends on a frame actually
 * firing, which a browser suspends whenever the document is hidden - a
 * background tab would mount the panel and leave it stuck closed until it was
 * looked at. Declaring the animation avoids that dependency entirely, and
 * matches how `.page` already animates elsewhere in the app.
 *
 * Children stay mounted for the exit animation, then unmount. Nothing clips
 * overflow, so popovers and focus rings inside the panel are never cut off.
 */
export default function RevealPanel({ open, children, className = '' }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      return undefined;
    }
    if (!mounted) return undefined;

    setClosing(true);
    const timer = setTimeout(() => {
      setClosing(false);
      setMounted(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div className={`reveal-panel ${closing ? 'is-closing' : ''} ${className}`}>
      {children}
    </div>
  );
}
