export const rows = [
  { id: 'ada', name: 'Ada', surname: 'Lovelace', status: 'Active', score: 96, amount: 125.5, profile: { city: 'London' }, email: 'ada@example.test' },
  { id: 'grace', name: 'Grace', surname: 'Hopper', status: 'Active', score: 92, amount: 250, profile: { city: 'New York' }, email: 'grace@example.test' },
  { id: 'alan', name: 'Alan', surname: 'Turing', status: 'Pending', score: 88, amount: 80, profile: { city: 'Manchester' }, email: 'alan@example.test' },
  { id: 'katherine', name: 'Katherine', surname: 'Johnson', status: 'Active', score: 99, amount: 310, profile: { city: 'Hampton' }, email: 'katherine@example.test' },
  { id: 'margaret', name: 'Margaret', surname: 'Hamilton', status: 'Inactive', score: 85, amount: 175, profile: { city: 'Cambridge' }, email: 'margaret@example.test' },
  { id: 'dorothy', name: 'Dorothy', surname: 'Vaughan', status: 'Pending', score: 90, amount: 140, profile: { city: 'Hampton' }, email: 'dorothy@example.test' },
  { id: 'mary', name: 'Mary', surname: 'Jackson', status: 'Active', score: 94, amount: 220, profile: { city: 'Hampton' }, email: 'mary@example.test' },
  { id: 'annie', name: 'Annie', surname: 'Easley', status: 'Inactive', score: 87, amount: 160, profile: { city: 'Cleveland' }, email: 'annie@example.test' }
];
export const headers = [{ field: 'name', label: 'Name' }, { field: 'status', label: 'Status' },
  { field: 'score', label: 'Score', align: 'right' }];
export const onlyFormat = format => Object.fromEntries(['csv', 'txt', 'json', 'xlsx', 'pdf'].map(key => [key, key === format]));
