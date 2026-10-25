export interface ExportJob<T> {
  label: string;
  run: () => Promise<T>;
}

export interface ExportFailure {
  label: string;
  reason: string;
}

export interface ExportOutcome<T> {
  results: T[];
  done: string[];
  failed: ExportFailure[];
}

export interface ExportSummary {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export function isExportCancelled(error: unknown): boolean {
  return error instanceof Error && error.message === 'Export cancelled';
}

export function exportFailureReason(error: unknown): string {
  let current: unknown = error;
  while (current instanceof Error && current.cause instanceof Error)
    current = current.cause;
  return current instanceof Error ? current.message : String(current);
}

export async function runExportJobs<T>(
  jobs: readonly ExportJob<T>[]
): Promise<ExportOutcome<T>> {
  const outcome: ExportOutcome<T> = { results: [], done: [], failed: [] };
  for (const job of jobs) {
    try {
      outcome.results.push(await job.run());
      outcome.done.push(job.label);
    } catch (error) {
      if (isExportCancelled(error)) throw error;
      outcome.failed.push({
        label: job.label,
        reason: exportFailureReason(error)
      });
    }
  }
  return outcome;
}

function groupByReason(failed: readonly ExportFailure[]) {
  const groups = new Map<string, string[]>();
  for (const { label, reason } of failed)
    groups.set(reason, [...(groups.get(reason) ?? []), label]);
  return groups;
}

export function summariseExport(
  { done, failed }: Pick<ExportOutcome<unknown>, 'done' | 'failed'>,
  savedAs = 'downloaded'
): ExportSummary {
  if (!failed.length)
    return { type: 'success', message: `${done.join(', ')} ${savedAs}` };
  const groups = groupByReason(failed);
  const failures = [...groups]
    .map(([reason, labels]) => `${labels.join(', ')} failed: ${reason}`)
    .join(' ');
  if (!done.length)
    return {
      type: 'error',
      message:
        groups.size === 1 ? `Export failed: ${[...groups.keys()][0]}` : failures
    };
  return {
    type: 'warning',
    message: `${done.join(', ')} ${savedAs}. ${failures}`
  };
}
