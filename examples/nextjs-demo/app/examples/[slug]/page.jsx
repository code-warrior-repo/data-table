import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { examples } from '../../../examples/catalog';
import ExampleRunner from '../../../examples/ExampleRunner';

export const dynamicParams = false;
export function generateStaticParams() { return examples.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${examples.find(example => example.slug === slug)?.title ?? 'Example'} | DynamicTable` };
}
export default async function Page({ params }) {
  const { slug } = await params;
  const example = examples.find(item => item.slug === slug);
  if (!example) notFound();
  // Only catalogued filenames are read. The source is included in the statically generated page.
  const source = await readFile(path.join(process.cwd(), 'examples', `${example.slug}.jsx`), 'utf8');
  return <main>
    <Link href="/">All examples</Link>
    <h1>{example.title}</h1>
    <p>{example.description}</p>
    <ExampleRunner slug={slug} />
    <details style={{ marginTop: 24 }}><summary>Example source</summary>
      <pre style={{ overflowX: 'auto', padding: 16, border: '1px solid', borderRadius: 4 }}><code>{source}</code></pre>
      <p>Shared synthetic rows and column definitions are in <code>examples/shared.js</code>. Remote examples use <code>examples/mockServer.js</code>.</p>
    </details>
  </main>;
}
