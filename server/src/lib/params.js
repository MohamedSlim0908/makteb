export function param(req, name) {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

export function query(req, name) {
  const val = req.query[name];
  if (val === undefined) return undefined;
  return Array.isArray(val) ? String(val[0]) : String(val);
}

export function parsePagination(req, defaultLimit = 20) {
  const page = parseInt(query(req, 'page') || '1', 10);
  const take = parseInt(query(req, 'limit') || String(defaultLimit), 10);
  const skip = (page - 1) * take;
  return { page, skip, take };
}
