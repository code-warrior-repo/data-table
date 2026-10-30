import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClientExample from '../examples/nextjs-demo/examples/client-pagination-all-features.jsx';
import ServerExample from '../examples/nextjs-demo/examples/server-pagination-all-features.jsx';
import { createFullFeatureBackend } from '../examples/nextjs-demo/examples/full-feature-server.js';
import { createSpringDataSource, fetchAllSpringRows, toSpringRequest } from '../src/spring.js';

const ready = async () => {
  await waitFor(() => expect(screen.queryByRole('progressbar', { name: 'Loading rows' })).not.toBeInTheDocument(), { timeout: 3000 });
};
const selectFirst = () => fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1', exact: true }));

describe('complete pagination examples', () => {
  it('uses cross-page client selection for working bulk email/removal and restores data', () => {
    render(<ClientExample />);
    expect(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument();
    selectFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByRole('cell', { name: 'Katherine Johnson' })).toBeInTheDocument();
    selectFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Email selected', exact: true }));
    expect(screen.getByTestId('feature-feedback')).toHaveTextContent('ada@example.test, katherine@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected', exact: true }));
    expect(screen.getByTestId('feature-feedback')).toHaveTextContent('Removed 2');
    expect(screen.getByTestId('feature-selection')).toHaveTextContent('Selected IDs: none');
    expect(screen.queryByRole('cell', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
    expect(screen.getByText('1–3 of 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore data' }));
    expect(screen.getByText('1–3 of 8')).toBeInTheDocument();
  });
  it('runs dynamic client row actions and exposes loading/error/empty states', () => {
    render(<ClientExample />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Ada', exact: true }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Mark pending', exact: true }));
    expect(screen.getByTestId('feature-feedback')).toHaveTextContent("Updated Ada's status.");
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Ada', exact: true }));
    expect(screen.getByRole('menuitem', { name: 'Mark active', exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Clone', exact: true }));
    expect(screen.getByText('1–3 of 9')).toBeInTheDocument();
    const choosePreview = name => {
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Preview table state' }));
      fireEvent.click(screen.getByRole('option', { name, exact: true }));
    };
    choosePreview('Loading');
    expect(screen.getByRole('progressbar', { name: 'Loading rows' })).toBeInTheDocument();
    choosePreview('Error');
    expect(screen.getByText('Example error state. Choose Ready to continue.')).toBeInTheDocument();
    choosePreview('Empty');
    expect(screen.getByText('No customers match. Clear filters or restore the example data.')).toBeInTheDocument();
  });
  it('resolves selected server IDs from unloaded pages and retries a failed request', async () => {
    render(<ServerExample />);
    await ready();
    selectFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await ready();
    expect(screen.queryByRole('cell', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
    selectFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Email selected', exact: true }));
    expect(screen.getByTestId('feature-feedback')).toHaveTextContent('ada@example.test, katherine@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected', exact: true }));
    await ready();
    expect(screen.getByText('1–3 of 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fail next request' }));
    await screen.findByText('Table request failed (503)');
    fireEvent.click(screen.getByRole('button', { name: 'Retry request' }));
    await ready();
    expect(screen.queryByText('Table request failed (503)')).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Grace Hopper' })).toBeInTheDocument();
  });
  it('uses one isolated Spring source for paging, typed filtering and complete export', async () => {
    const backend = createFullFeatureBackend({ latency: 0 });
    const otherBackend = createFullFeatureBackend({ latency: 0 });
    const source = createSpringDataSource({ url: '/api/customers', fetcher: backend.fetcher });
    const query = { rowsPerPage: 3, columnFilters: { score: '90' }, sorting: [{ field: 'score', order: 'desc' }] };
    const page = await source(toSpringRequest(query));
    expect(page.rowCount).toBe(5);
    expect(page.rows).toHaveLength(3);
    const all = await fetchAllSpringRows({ dataSource: source, query, pageSize: 3, getRowId: row => row.id });
    expect(all.map(row => row.score)).toEqual([99, 96, 94, 92, 90]);
    backend.remove(['ada']); backend.toggleStatus('grace'); backend.clone('alan');
    expect(backend.previewEmails(['ada'])).toEqual([]);
    expect(otherBackend.previewEmails(['ada'])).toEqual(['ada@example.test']);
    backend.restore();
    expect((await source(toSpringRequest({ rowsPerPage: 3 }))).rowCount).toBe(8);
  });
  it.each([['client', ClientExample], ['server', ServerExample]])('enables every built-in export format in the complete %s demo', async (_mode, Component) => {
    render(<Component />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Export menu', exact: true }));
    expect(screen.getAllByRole('menuitem').map(item => item.textContent).sort()).toEqual(['CSV', 'JSON', 'PDF', 'TXT', 'XLSX']);
  });
  it('aborts obsolete mock requests without committing a result', async () => {
    const backend = createFullFeatureBackend();
    const source = createSpringDataSource({ url: '/api/customers', fetcher: backend.fetcher });
    const controller = new AbortController();
    const request = source(toSpringRequest({ rowsPerPage: 3 }, { signal: controller.signal }));
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
