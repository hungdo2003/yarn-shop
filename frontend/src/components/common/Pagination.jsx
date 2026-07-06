const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination) return null;
  const { page, totalPages } = pagination;
  if (!totalPages || totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const visible = new Set([1, totalPages]);
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
      visible.add(i);
    }
    const sorted = Array.from(visible).sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev === 2) result.push(prev + 1);
      else if (p - prev > 2) result.push(`dot-${p}`);
      result.push(p);
      prev = p;
    }
    return result;
  };

  const pages = getPages();

  const btn = (active) =>
    `min-w-[36px] xs:min-w-[44px] h-9 xs:h-11 px-2 xs:px-2.5 rounded-lg text-sm font-medium border transition-all active:scale-95 ${
      active
        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
        : 'border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600'
    }`;

  return (
    <div className="flex items-center justify-center gap-1 xs:gap-1.5 mt-6 xs:mt-8 select-none overflow-x-auto pb-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-9 xs:h-11 px-2.5 xs:px-3 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0"
      >
        ‹
      </button>

      {pages.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="text-gray-400 text-sm px-0.5 select-none shrink-0">···</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} className={btn(p === page) + ' shrink-0'}>
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-9 xs:h-11 px-2.5 xs:px-3 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
