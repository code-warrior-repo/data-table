import Link from 'next/link';
import { examples } from '../examples/catalog';

export default function Page() {
  const groups = [...new Set(examples.map(example => example.group))];
  return <main>
    <h1>DynamicTable examples</h1>
    <p>{examples.length} individual examples. Each page demonstrates one implemented feature and includes its source.</p>
    <p>All records are synthetic. Remote examples use an in-memory backend; email examples only preview recipients.</p>
    {groups.map(group => <section key={group} aria-labelledby={`group-${group}`}>
      <h2 id={`group-${group}`}>{group}</h2>
      <ul>{examples.filter(example => example.group === group).map(example => <li key={example.slug} style={{ marginBottom: 12 }}>
        <Link href={`/examples/${example.slug}`}>{example.title}</Link> — {example.description}
      </li>)}</ul>
    </section>)}
  </main>;
}
