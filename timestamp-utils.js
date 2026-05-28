(function attachStudyHiveTimestamps(root) {
  const MANILA_TIME_ZONE = 'Asia/Manila';
  const LOCALE = 'en-PH';
  const MINUTE_MS = 60 * 1000;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;

  const manilaTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const manilaDateFormatter = new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const manilaDayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  function getTimestampMillis(value) {
    if (!value) return Number.NaN;
    if (value instanceof Date) return value.getTime();
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();

    if (typeof value.seconds === 'number') {
      return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1000000);
    }

    if (typeof value._seconds === 'number') {
      return (value._seconds * 1000) + Math.floor((value._nanoseconds || 0) / 1000000);
    }

    if (typeof value === 'number') {
      return value < 1000000000000 ? value * 1000 : value;
    }

    const trimmedValue = String(value || '').trim();
    if (!trimmedValue) return Number.NaN;

    if (/^\d+$/.test(trimmedValue)) {
      const numericValue = Number(trimmedValue);
      return numericValue < 1000000000000 ? numericValue * 1000 : numericValue;
    }

    const parsed = Date.parse(trimmedValue);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  function parseTimestamp(value) {
    const millis = getTimestampMillis(value);
    return Number.isNaN(millis) ? null : new Date(millis);
  }

  function getManilaDayKey(value) {
    const date = value instanceof Date ? value : parseTimestamp(value);
    return date ? manilaDayFormatter.format(date) : '';
  }

  function getPreviousManilaDayKey(now = new Date()) {
    return manilaDayFormatter.format(new Date(now.getTime() - DAY_MS));
  }

  function pluralize(value, unit) {
    return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
  }

  function formatRelativeTimestamp(value, options = {}) {
    const date = parseTimestamp(value);
    if (!date) return 'Just now';

    const now = options.now instanceof Date ? options.now : new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());

    if (diffMs < MINUTE_MS) return 'Just now';
    if (diffMs < HOUR_MS) return pluralize(Math.floor(diffMs / MINUTE_MS), 'minute');
    if (diffMs < DAY_MS) return pluralize(Math.floor(diffMs / HOUR_MS), 'hour');
    if (getManilaDayKey(date) === getPreviousManilaDayKey(now)) return 'Yesterday';

    return manilaDateFormatter.format(date);
  }

  function formatManilaTime(value) {
    const date = parseTimestamp(value);
    return date ? manilaTimeFormatter.format(date) : '';
  }

  function formatManilaDate(value) {
    const date = parseTimestamp(value);
    return date ? manilaDateFormatter.format(date) : '';
  }

  const api = {
    MANILA_TIME_ZONE,
    getTimestampMillis,
    parseTimestamp,
    formatRelativeTimestamp,
    formatManilaTime,
    formatManilaDate
  };

  root.StudyHiveTimestamps = api;
  root.StudyHive = root.StudyHive || {};
  root.StudyHive.timestamps = api;
})(typeof window !== 'undefined' ? window : globalThis);
