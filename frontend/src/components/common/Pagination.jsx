const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">
        Prev
      </button>
      {start > 1 && <><span className="px-3 py-1.5 text-sm">1</span><span className="text-gray-400">...</span></>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm border ${p === page ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}>
          {p}
        </button>
      ))}
      {end < totalPages && <><span className="text-gray-400">...</span><span className="px-3 py-1.5 text-sm">{totalPages}</span></>}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">
        Next
      </button>
    </div>
  );
};

export default Pagination;
