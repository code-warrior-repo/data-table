'use client';
import { exampleComponents } from './registry';

export default function ExampleRunner({ slug }) {
  const Component = exampleComponents[slug];
  return Component ? <Component key={slug} /> : null;
}
