const generateCode = (prefix = 'ORD') => {
  const timestamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${rand}`;
};

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 12);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginateResult = (count, rows, page, limit) => ({
  items: rows,
  pagination: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  }
});

module.exports = { generateCode, slugify, paginate, paginateResult };
