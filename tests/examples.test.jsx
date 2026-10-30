import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { examples } from '../examples/nextjs-demo/examples/catalog.js';
import { exampleComponents } from '../examples/nextjs-demo/examples/registry.jsx';
import { loadPage } from '../examples/nextjs-demo/examples/mockServer.js';

describe('individual example catalog', () => {
  it('has one distinct component and unique route for every catalog entry', () => {
    expect(new Set(examples.map(example => example.slug)).size).toBe(examples.length);
    expect(Object.keys(exampleComponents).sort()).toEqual(examples.map(example => example.slug).sort());
    expect(new Set(Object.values(exampleComponents)).size).toBe(examples.length);
  });
  it.each(examples)('renders $slug', async ({ slug }) => {
    const Component = exampleComponents[slug];
    const { container } = render(<Component />);
    expect(container).not.toBeEmptyDOMElement();
    if (['server-pagination', 'spring-adapter'].includes(slug)) {
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
      expect(screen.getByText('Ada')).toBeInTheDocument();
    }
  });
  it('lets the parent and built-in pager control the same page', () => {
    const Component = exampleComponents['controlled-page'];
    render(<Component />);
    fireEvent.click(screen.getByRole('button', { name: 'Second group' }));
    expect(screen.getByRole('status')).toHaveTextContent('Parent-controlled page: 2');
    expect(screen.getByText('Katherine')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByRole('status')).toHaveTextContent('Parent-controlled page: 3');
    expect(screen.getByText('Mary')).toBeInTheDocument();
  });
  it('shows only the requested format in each dedicated export example', () => {
    const Component = exampleComponents['export-json'];
    render(<Component />);
    fireEvent.click(screen.getByLabelText('Export menu'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: 'JSON' })).toBeInTheDocument();
  });
  it('previews recipients without sending a message', () => {
    const Component = exampleComponents['email-selection'];
    render(<Component />);
    fireEvent.click(screen.getByLabelText('Select email row 1'));
    fireEvent.click(screen.getByLabelText('Send email'));
    expect(screen.getByRole('alert')).toHaveTextContent('Recipients: Ada');
  });
  it('cancels the example backend request', async () => {
    const controller = new AbortController();
    const pending = loadPage({ page: 0, rowsPerPage: 3 }, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('surfaces the simulated full-export failure', async () => {
    const Component = exampleComponents['export-errors'];
    render(<Component />);
    fireEvent.click(screen.getByLabelText('Export menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    await waitFor(() => expect(screen.getByText('The simulated export service is unavailable.')).toBeInTheDocument());
  });
  it('uses the custom JSON handler instead of a browser download', async () => {
    const createObjectURL = vi.fn();
    const original = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    try {
      const Component = exampleComponents['custom-export-handler'];
      render(<Component />);
      fireEvent.click(screen.getByLabelText('Export menu'));
      fireEvent.click(screen.getByRole('menuitem', { name: 'JSON' }));
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Custom handler received 8 rows'));
      expect(createObjectURL).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(URL, 'createObjectURL', original);
      else delete URL.createObjectURL;
    }
  });
});
