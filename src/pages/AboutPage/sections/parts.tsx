import { type ReactNode, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';

/**
 * Shared presentational building blocks for the About sections. They follow the
 * document-style "heading → thin separator → airy content" rhythm shared with
 * the Settings sections (instead of wrapping each block in a bordered card), so
 * the About page reads as an open, document-like page rather than a stack of
 * cramped boxes. A genuine card is reserved for distinct callouts only.
 */

/** Top heading for an About section. */
export function SectionHeading({
  icon: Icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <h2 className="mb-2 flex items-center gap-2.5 font-display text-2xl font-bold text-text-primary sm:text-3xl">
      <Icon
        className="h-6 w-6 text-text-secondary sm:h-7 sm:w-7"
        aria-hidden="true"
      />
      {title}
    </h2>
  );
}

/** Lead paragraph shown under a section heading. */
export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="text-lg leading-relaxed text-text-secondary">{children}</p>
  );
}

/**
 * A titled prose block: sub-heading with a thin separator under it, then airy
 * content. Despite the legacy name this is NOT a bordered card — it is the
 * open, document-style rhythm. (Name kept so the many callers stay untouched.)
 */
export function InfoCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-border pb-2 text-xl font-bold text-text-primary">
        {title}
      </h3>
      <div className="space-y-3 text-base leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}

/** A genuinely distinct, bordered callout block (e.g. a copyable wallet box). */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
      {children}
    </section>
  );
}

/** A compact stat/fact pill row inside a card. */
export function FactRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span className="flex items-center gap-2.5 text-base text-text-secondary">
        <Icon className="h-5 w-5 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 wrap-break-word text-right text-base font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}

/** Wrapper that renders FactRows as a divided card. */
export function FactList({ children }: { children: ReactNode }) {
  return (
    <section className="divide-y divide-border/60 rounded-2xl border border-border bg-surface-elevated">
      {children}
    </section>
  );
}

/** A primary external-link button (opens in a new tab, secured). */
export function ExternalLinkButton({
  href,
  icon: Icon,
  children,
  variant = 'neutral'
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  variant?: 'primary' | 'neutral';
}) {
  const base =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
  const variants = {
    primary: 'bg-accent text-bg hover:bg-accent-hover',
    neutral:
      'border border-border bg-surface text-text-primary hover:bg-surface-hover'
  } as const;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${variants[variant]}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

/** A mailto link styled as a neutral button. */
export function MailButton({
  email,
  subject,
  icon: Icon,
  children
}: {
  email: string;
  subject?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

/** A collapsible FAQ accordion item, matching the existing FAQ idiom. */
export function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border transition-colors duration-200">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset rounded-xl"
        aria-expanded={isOpen}
      >
        <span className="pr-4 text-lg font-semibold text-text-primary">
          {q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-base leading-relaxed text-text-secondary">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
