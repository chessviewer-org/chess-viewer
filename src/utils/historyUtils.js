const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const NINETY_DAYS_MS = 90 * DAY_MS;

/**
 * Returns a color-coded freshness status for a history entry.
 *
 * @param {number} lastActiveAt - Unix timestamp of last activity
 * @returns {'green'|'yellow'|'red'} Freshness status
 */
export function calculateStatus(lastActiveAt) {
  const age = Date.now() - lastActiveAt;
  if (age < SEVEN_DAYS_MS) return 'green';
  if (age < THIRTY_DAYS_MS) return 'yellow';
  return 'red';
}

/**
 * @param {number} lastActiveAt - Unix timestamp of last activity
 * @returns {boolean} True if the entry is old enough to archive (90+ days)
 */
function shouldArchive(lastActiveAt) {
  return Date.now() - lastActiveAt >= NINETY_DAYS_MS;
}

/**
 * Checks whether a single history entry matches the given filter criteria.
 *
 * @param {Object} entry - History entry
 * @param {Object} filters - Active filter values
 * @returns {boolean}
 */
function matchesFilters(entry, filters) {
  if (filters.fenSearch) {
    if (!entry.fen.toLowerCase().includes(filters.fenSearch.toLowerCase())) {
      return false;
    }
  }
  if (filters.dateFrom && entry.createdAt < filters.dateFrom) return false;
  if (filters.dateTo && entry.createdAt > filters.dateTo) return false;
  if (
    filters.status &&
    calculateStatus(entry.lastActiveAt) !== filters.status
  ) {
    return false;
  }
  if (filters.source && entry.source !== filters.source) return false;
  if (filters.favoritesOnly && !entry.isFavorite) return false;
  return true;
}

/**
 * Filters a list of history entries by the given criteria.
 *
 * @param {Object[]} entries - History entries
 * @param {Object} filters - Active filter values
 * @returns {Object[]} Filtered entries
 */
export function applyFilters(entries, filters) {
  if (!filters || Object.keys(filters).length === 0) return entries;
  return entries.filter((entry) => matchesFilters(entry, filters));
}

/**
 * Splits entries into those that remain active and those ready to archive.
 *
 * @param {Object[]} entries - History entries
 * @returns {{ active: Object[], toArchive: Object[] }}
 */
export function partitionByArchiveStatus(entries) {
  const active = [];
  const toArchive = [];
  for (const entry of entries) {
    if (entry.isFavorite || !shouldArchive(entry.lastActiveAt)) {
      active.push(entry);
    } else {
      toArchive.push(entry);
    }
  }
  return { active, toArchive };
}

/**
 * Converts an active history entry into an archived entry shape.
 *
 * @param {Object} entry - Active history entry
 * @param {string} [archiveSource='auto'] - How the archiving was triggered
 * @returns {Object} Archived entry
 */
export function convertToArchivedEntry(entry, archiveSource = 'auto') {
  return {
    id: entry.id,
    fen: entry.fen,
    createdAt: entry.createdAt,
    lastActiveAt: entry.lastActiveAt,
    archivedAt: Date.now(),
    source: entry.source,
    archiveSource,
    isFavorite: entry.isFavorite
  };
}

/**
 * Converts an archived entry back to an active history entry shape.
 *
 * @param {Object} archived - Archived entry
 * @returns {Object} Active history entry
 */
export function convertFromArchivedEntry(archived) {
  return {
    id: archived.id,
    fen: archived.fen,
    createdAt: archived.createdAt,
    lastActiveAt: Date.now(),
    source: archived.source,
    isFavorite: archived.isFavorite
  };
}

/**
 * Returns a copy of the entry with `lastActiveAt` updated to now.
 *
 * @param {Object} entry - History entry
 * @returns {Object} Updated entry
 */
export function touchEntry(entry) {
  return { ...entry, lastActiveAt: Date.now() };
}

/**
 * Creates a new history entry for the given FEN.
 *
 * @param {string} fen - FEN string
 * @param {'manual'|'export'|'drag'} source - How the entry was created
 * @param {string|null} [dragSessionId=null] - Drag session identifier
 * @returns {Object} New history entry
 */
export function createHistoryEntry(fen, source, dragSessionId = null) {
  const now = Date.now();
  return {
    id: now,
    fen,
    createdAt: now,
    lastActiveAt: now,
    source,
    isFavorite: false,
    ...(dragSessionId ? { dragSessionId } : {})
  };
}

/**
 * @param {Object[]} entries - History entries
 * @returns {Object[]} Entries sorted by `lastActiveAt` descending
 */
export function sortByMostRecent(entries) {
  return [...entries].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/**
 * @param {Object[]} entries - Archived entries
 * @returns {Object[]} Entries sorted by `archivedAt` descending
 */
export function sortArchivedByArchiveDate(entries) {
  return [...entries].sort((a, b) => b.archivedAt - a.archivedAt);
}
