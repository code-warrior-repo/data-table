import { performance } from 'node:perf_hooks';
import { buildRowModel } from '../dist/core.js';
for (const count of [1000, 10000]) {
  const data = Array.from({ length: count }, (_, id) => ({ id, name: `Customer ${id}`, amount: (id * 7919) % count }));
  const options = { data, headers: [{ field: 'id' }, { field: 'name' }, { field: 'amount', dataType: 'number' }],
    searchText: 'Customer', sorting: [{ field: 'amount', order: 'desc' }], rowsPerPage: 25 };
  const durations = [];
  for (let iteration = 0; iteration < 6; iteration++) {
    const start = performance.now();
    buildRowModel(options);
    if (iteration) durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);
  console.log(`${count} rows, 3 columns, filter + sort + page: median ${durations[2].toFixed(2)} ms (5 warm runs; Node ${process.version})`);
}
