import { type ReactNode } from 'react';

import type { LucideIcon } from '@/assets/icons';
import styles from '../styles/settings-parts.module.scss';

export function SettingsHeading({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className={styles['headingWrapper']}>
      <h2 className={styles['headingTitle']}>
        <Icon className={styles['headingIcon']} aria-hidden="true" />
        {title}
      </h2>
      {description && <p className={styles['headingDesc']}>{description}</p>}
    </div>
  );
}

export function SettingsBlock({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles['blockSection']}>
      <div className={styles['blockHeader']}>
        <div className={styles['blockTitleWrapper']}>
          <h3 className={styles['blockTitle']}>{title}</h3>
          {action && <div className={styles['blockAction']}>{action}</div>}
        </div>
        {description && <p className={styles['blockDesc']}>{description}</p>}
      </div>
      <div className={styles['blockContent']}>{children}</div>
    </section>
  );
}
