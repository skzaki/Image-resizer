import React, { useEffect, useRef, useState } from 'react';
import { fetchUserPrivateFiles } from '../lib/storageHelper';

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|tiff?)($|\?)/i;

export default function RecentImages({ user, max = 5 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return setItems([]);
      setLoading(true);
      setError(null);
      try {
        // Use a higher limit to allow filtering of non-image items and broken URLs.
        const userPrefixRaw = user?.username || user?.attributes?.email || '';
        const userPrefix = userPrefixRaw ? String(userPrefixRaw).replace(/[^a-zA-Z0-9-_\\.]/g, '_') : '';
        const path = userPrefix ? `resized/${userPrefix}` : '';
        const list = await fetchUserPrivateFiles({ path, limit: 30 });
        if (!mounted) return;

        // Filter to items with a non-empty URL and an image-like extension.
        const valid = (list || []).filter(it => {
          if (!it || !it.url) return false;
          if (IMAGE_EXT_RE.test(it.url)) return true;
          if (it.url.startsWith('data:image/')) return true;
          return false;
        });

        setItems(valid);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load recent images');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

  const scrollBy = (dir = 1) => {
    const track = trackRef.current;
    if (!track) return;
    // Scroll by width of five items (approx viewport / 5)
    const visibleCount = 5;
    const item = track.querySelector('.recent-item');
    const step = item ? item.clientWidth * visibleCount : track.clientWidth;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector('.recent-item');
    const step = item ? item.clientWidth * 5 : track.clientWidth;
    const current = Math.round(track.scrollLeft / step);
    setPage(current);
  };

  if (!user) return null;

  return (
    <section className="w-full">
      <div className="bg-gradient-to-r from-white to-blue-50 border rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Recent images</h3>
            <p className="text-sm text-gray-500">Your latest uploads — private to your account</p>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading recent images…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && items.length === 0 && <div className="text-sm text-gray-600">No recent images found in your cloud storage.</div>}

        {!loading && items.length > 0 && (
          <div className="relative">
            <div
              ref={trackRef}
              className="no-scrollbar overflow-x-auto flex gap-3 py-2 px-1 scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'ArrowLeft') scrollBy(-1); if (e.key === 'ArrowRight') scrollBy(1); }}
              onScroll={onScroll}
            >
              {items.map((it, idx) => (
                <a
                  key={`${it.key}-${idx}`}
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="recent-item flex-shrink-0 w-1/5 rounded-lg overflow-hidden border border-gray-100 bg-white shadow transition transform hover:scale-105"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative w-full h-36 bg-gray-100">
                    <img
                      src={it.url}
                      alt={it.key}
                      className="w-full h-36 object-cover"
                      onError={(e) => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}

              {/* Left / Right overlay controls (desktop) */}
            </div>

            <button
              aria-label="Scroll left"
              title="Previous"
              onClick={() => scrollBy(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl focus:outline-none transform transition hover:scale-105 ring-2 ring-white/20"
              style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.95), rgba(6,182,212,0.95))', color: '#fff', backdropFilter: 'blur(6px)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              aria-label="Scroll right"
              title="Next"
              onClick={() => scrollBy(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl focus:outline-none transform transition hover:scale-105 ring-2 ring-white/20"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.95), rgba(139,92,246,0.95))', color: '#fff', backdropFilter: 'blur(6px)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Page indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {Array.from({ length: Math.max(1, Math.ceil(items.length / 5)) }).map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition ${i === page ? 'bg-blue-600' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
