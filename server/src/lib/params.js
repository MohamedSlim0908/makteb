export function param(req, name) {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

export function query(req, name) {
  const val = req.query[name];
  if (val === undefined) return undefined;
  return Array.isArray(val) ? String(val[0]) : String(val);
}
