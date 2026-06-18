export function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString('es', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatViews(count?: number): string {
  if (!count) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M vistas`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K vistas`;
  return `${count} vistas`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
