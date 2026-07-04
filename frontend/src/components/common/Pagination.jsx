const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination) return null;
  const { page, totalPages } = pagination;
  if (!totalPages || totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // 5+ pages: always show 1 and last, plus current ± 1
    const visible = new Set([1, totalPages]);
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
      visible.add(i);
    }
    const sorted = Array.from(visible).sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev === 2) result.push(prev + 1); // fill single gap
      else if (p - prev > 2) result.push(`dot-${p}`); // ellipsis
      result.push(p);
      prev = p;
    }
    return result;
  };

  const pages = getPages();

  const btn = (active) =>
    `min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-medium border transition-all ${
      active
        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
        : 'border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600'
    }`;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 select-none">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-9 px-3 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ‹
      </button>

      {pages.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="text-gray-400 text-sm px-0.5 select-none">···</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} className={btn(p === page)}>
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-9 px-3 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
