import { memo } from 'react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const PaginationDots = memo(function PaginationDots({
  currentPage,
  totalPages,
  onPageChange,
  isPageDisabled
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {Array.from(
        {
          length: totalPages
        },
        (_, i) => i
      ).map((pageNum) => {
        const disabled = Boolean(isPageDisabled?.(pageNum));
        return (
          <button
            key={`page-dot-${pageNum}`}
            onClick={() => !disabled && onPageChange(pageNum)}
            disabled={disabled}
            className={`h-2.5 rounded-full transition-all duration-300 ${pageNum === currentPage ? 'w-6 bg-accent shadow-[0_0_0_1px_rgba(210,155,30,0.45)]' : 'w-2.5 bg-border'} ${disabled ? 'opacity-45 cursor-not-allowed' : 'hover:bg-text-muted'}`}
            aria-label={`Go to page ${pageNum + 1}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
          />
        );
      })}
    </div>
  );
});
PaginationDots.displayName = 'PaginationDots';
export default PaginationDots;
