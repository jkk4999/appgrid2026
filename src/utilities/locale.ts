// Locale utilities

// Normalize a locale string for use with Intl APIs.
// - Converts Salesforce-style underscores (en_US) to hyphens (en-US)
// - Probes the tag with Intl.DateTimeFormat; falls back to browser locale or en-US if invalid
export function normalizeLocale(raw?: string, fallback?: string): string {
  const candidate = String(raw || fallback || '').trim();
  const withHyphen = candidate ? candidate.replace(/_/g, '-') : '';
  const probe = (loc: string | undefined): string | null => {
    if (!loc) return null;
    try {
      // If the locale is not supported, this will throw
      new Intl.DateTimeFormat(loc);
      return loc;
    } catch {
      return null;
    }
  };

  return (
    probe(withHyphen) ||
    (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().locale; } catch { return 'en-US'; }
    })()
  );
}

