import { type ReactNode, useState } from 'react';
import { ChevronDown, type LucideIcon } from '@/assets/icons';
import styles from '../styles/about-parts.module.scss';

export function SectionHeading({
  icon: Icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <h2 className={styles['heading']}>
      <Icon className={styles['headingIcon']} aria-hidden="true" />
      {title}
    </h2>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className={styles['lead']}>{children}</p>;
}

export function InfoCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles['infoCard']}>
      <h3 className={styles['infoCardTitle']}>{title}</h3>
      <div className={styles['infoCardBody']}>{children}</div>
    </section>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <section className={styles['callout']}>{children}</section>;
}

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
    <div className={styles['factRow']}>
      <span className={styles['factLabel']}>
        <Icon className={styles['factIcon']} aria-hidden="true" />
        {label}
      </span>
      <span className={styles['factValue']}>{value}</span>
    </div>
  );
}

export function FactList({ children }: { children: ReactNode }) {
  return <section className={styles['factList']}>{children}</section>;
}

export function ExternalLinkButton({
  href,
  icon: Icon,
  children,
  variant = 'neutral',
  className = ''
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  variant?: 'primary' | 'neutral';
  className?: string;
}) {
  const variantClass =
    variant === 'primary' ? styles['btnPrimary'] : styles['btnNeutral'];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles['btn']} ${variantClass} ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

export function MailButton({
  email,
  subject,
  icon: Icon,
  children,
  className = ''
}: {
  email: string;
  subject?: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return (
    <a
      href={href}
      className={`${styles['btn']} ${styles['btnNeutral']} ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

export function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles['faqItem']}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles['faqButton']}
        aria-expanded={isOpen}
      >
        <span className={styles['faqText']}>{q}</span>
        <ChevronDown
          className={`${styles['faqIcon']} ${isOpen ? styles['faqIconOpen'] : ''}`}
        />
      </button>
      {isOpen && (
        <div className={styles['faqBody']}>
          <div className={styles['faqBodyText']}>{a}</div>
        </div>
      )}
    </div>
  );
}
