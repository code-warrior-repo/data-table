import { getByPath } from '../util.js';
export function rowIdentities(data, { getRowId, uniqueField, requireIds = false }) {
  const seen = new Set();
  const identities = new Map();
  data.forEach((row, index) => {
    if (identities.has(row)) throw new Error('Duplicate row ID or repeated row reference.');
    const supplied = getRowId ? getRowId(row) : getByPath(row, uniqueField || 'id');
    const id = supplied ?? (requireIds || getRowId ? undefined : index);
    if (!['string', 'number'].includes(typeof id) || (typeof id === 'string' && !id.trim()) ||
      (typeof id === 'number' && !Number.isFinite(id))) throw new Error('Rows with interactive controls require a stable string or number ID.');
    if (seen.has(id)) throw new Error(`Duplicate row ID: ${id}`);
    seen.add(id);
    identities.set(row, id);
  });
  return identities;
}
