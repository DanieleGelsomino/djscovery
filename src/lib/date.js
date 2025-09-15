export function toDateLike(input) {
  if (input == null) return null;
  if (typeof input?.toDate === 'function') {
    try { return input.toDate(); } catch { return null; }
  }
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'string') {
    // support YYYY-MM-DD or ISO
    const iso = input.length === 10 ? `${input}T00:00:00` : input;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'object' && (input.seconds || input._seconds)) {
    const s = input.seconds ?? input._seconds;
    const ns = input.nanoseconds ?? input._nanoseconds ?? 0;
    return new Date(s * 1000 + Math.floor(ns / 1e6));
  }
  return null;
}

export function formatDMY(input) {
  const d = toDateLike(input);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatHM(input) {
  if (input == null) return '';
  if (typeof input === 'string') {
    const m = String(input).match(/^(\d{1,2}):(\d{1,2})/);
    if (m) {
      const hh = String(parseInt(m[1], 10)).padStart(2, '0');
      const mm = String(parseInt(m[2], 10)).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    // try parse as Date-compatible string
    const d = toDateLike(input);
    if (d) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '';
  }
  const d = toDateLike(input);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
