'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  return <DynamicTable headers={headers} data={rows} searchByText
    labels={{ search: 'Rechercher', openSearch: 'Ouvrir la recherche', closeSearch: 'Fermer la recherche',
      rowsPerPage: 'Lignes par page :', nextPage: 'Page suivante', previousPage: 'Page précédente',
      firstPage: 'Première page', lastPage: 'Dernière page', displayedRows: ({ from, to, count }) => `${from}–${to} sur ${count}` }} />;
}
