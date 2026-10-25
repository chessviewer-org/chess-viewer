import { UserCircle } from '@/assets/icons';

interface AvatarInitialProps {
  displayName: string;
  size?: 'sm' | 'md';
}

export function AvatarInitial({
  displayName,
  size = 'sm'
}: AvatarInitialProps) {
  const dimensions = size === 'md' ? 'h-14 w-14 text-lg' : 'h-11 w-11 text-lg';

  return (
    <div
      className={`${dimensions} shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold uppercase`}
    >
      {displayName ? (
        displayName.charAt(0)
      ) : (
        <UserCircle className="w-8 h-8" aria-hidden="true" />
      )}
    </div>
  );
}
