export type ChangelogCategory =
  | 'Features'
  | 'Bug Fixes'
  | 'Performance Improvements'
  | 'Reverts';

export interface ChangelogEntry {
  scope: string | null;
  text: string;
  hash: string | null;
  commitUrl: string | null;
  issueNumber: string | null;
  issueUrl: string | null;
}

export interface ChangelogGroup {
  category: ChangelogCategory;
  entries: ChangelogEntry[];
}

export interface ChangelogMonth {
  title: string;
  year: number;
  groups: ChangelogGroup[];
  note: string | null;
}

export interface ChangelogYear {
  year: number;
  months: ChangelogMonth[];
}

const CATEGORY_TITLES: ReadonlySet<string> = new Set([
  'Features',
  'Bug Fixes',
  'Performance Improvements',
  'Reverts'
]);

const MONTH_RE = /^##\s+(\S+)\s+(\d{4})\s*$/;
const CATEGORY_RE = /^###\s+(.+)$/;
const ENTRY_RE = /^-\s+(.*)$/;

const SCOPE_RE = /^\*\*([^*]+):\*\*\s*/;
const HASH_LINK_RE = /\(\[#?([0-9a-f]{7})\]\(([^)]+)\)\)/;
const CLOSES_RE = /,?\s*closes\s+\[#(\d+)\]\(([^)]+)\)/i;

function parseEntry(line: string): ChangelogEntry {
  let rest = line;

  let scope: string | null = null;
  const scopeMatch = SCOPE_RE.exec(rest);
  if (scopeMatch?.[1]) {
    scope = scopeMatch[1];
    rest = rest.slice(scopeMatch[0].length);
  }

  let issueNumber: string | null = null;
  let issueUrl: string | null = null;
  const closesMatch = CLOSES_RE.exec(rest);
  if (closesMatch?.[1] && closesMatch[2]) {
    issueNumber = closesMatch[1];
    issueUrl = closesMatch[2];
    rest =
      rest.slice(0, closesMatch.index) +
      rest.slice(closesMatch.index + closesMatch[0].length);
  }

  let hash: string | null = null;
  let commitUrl: string | null = null;
  const hashMatch = HASH_LINK_RE.exec(rest);
  if (hashMatch?.[1] && hashMatch[2]) {
    hash = hashMatch[1];
    commitUrl = hashMatch[2];
    rest =
      rest.slice(0, hashMatch.index) +
      rest.slice(hashMatch.index + hashMatch[0].length);
  }

  return {
    scope,
    text: rest.trim(),
    hash,
    commitUrl,
    issueNumber,
    issueUrl
  };
}

function parseMonths(source: string): ChangelogMonth[] {
  const lines = source.split('\n');
  const months: ChangelogMonth[] = [];

  let currentMonth: ChangelogMonth | null = null;
  let currentGroup: ChangelogGroup | null = null;
  const noteLines: string[] = [];

  const flushNote = () => {
    if (currentMonth && noteLines.length > 0) {
      const text = noteLines.join(' ').trim();
      if (text) currentMonth.note = text;
    }
    noteLines.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    const monthMatch = MONTH_RE.exec(line);
    if (monthMatch?.[1] && monthMatch[2]) {
      flushNote();
      currentMonth = {
        title: `${monthMatch[1]} ${monthMatch[2]}`,
        year: Number(monthMatch[2]),
        groups: [],
        note: null
      };
      currentGroup = null;
      months.push(currentMonth);
      continue;
    }

    if (!currentMonth) continue;

    const categoryMatch = CATEGORY_RE.exec(line);
    if (categoryMatch?.[1] && CATEGORY_TITLES.has(categoryMatch[1].trim())) {
      currentGroup = {
        category: categoryMatch[1].trim() as ChangelogCategory,
        entries: []
      };
      currentMonth.groups.push(currentGroup);
      continue;
    }

    const entryMatch = ENTRY_RE.exec(line);
    if (entryMatch?.[1] && currentGroup) {
      currentGroup.entries.push(parseEntry(entryMatch[1]));
      continue;
    }

    if (line.trim() && !line.startsWith('---') && !currentGroup) {
      noteLines.push(line.trim());
    }
  }
  flushNote();

  return months;
}

export function parseChangelog(source: string): ChangelogYear[] {
  const months = parseMonths(source);
  const years: ChangelogYear[] = [];

  for (const month of months) {
    let year = years.find((y) => y.year === month.year);
    if (!year) {
      year = { year: month.year, months: [] };
      years.push(year);
    }
    year.months.push(month);
  }

  return years.sort((a, b) => b.year - a.year);
}
