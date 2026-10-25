import { type ReactNode } from 'react';
import { Link } from 'wouter';

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5">{children}</ol>;
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

export function Term({ children }: { children: ReactNode }) {
  return <strong className="text-text-primary">{children}</strong>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[0.8125rem] text-text-primary">
      {children}
    </kbd>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[0.8125rem] text-text-primary">
      {children}
    </code>
  );
}

export interface DocRow {
  id: string;
  cells: readonly ReactNode[];
}

export function DocTable({
  head,
  rows
}: {
  head: readonly string[];
  rows: readonly DocRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-[0.8125rem]">
        <thead className="bg-surface-elevated text-text-primary">
          <tr>
            {head.map((label) => (
              <th key={label} scope="col" className="px-3 py-2 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              {head.map((label, column) => (
                <td key={label} className="px-3 py-2 align-top">
                  {row.cells[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageLink({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-accent hover:underline">
      {children}
    </Link>
  );
}
