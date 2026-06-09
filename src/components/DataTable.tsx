import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  /** Renders the cell. */
  cell: (row: T) => ReactNode;
  /** Enables sorting when provided. */
  sortValue?: (row: T) => string | number;
  /** Initial sort direction when this column is first clicked. */
  defaultDir?: 'asc' | 'desc';
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Optional expandable detail panel per row. */
  renderExpanded?: (row: T) => ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderExpanded,
  initialSort,
  emptyMessage = 'No rows to display.',
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const getValue = column.sortValue;
    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  function toggleSort(column: Column<T>) {
    if (!column.sortValue) return;
    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, dir: column.defaultDir ?? 'asc' };
      }
      return { key: column.key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.headerClassName ?? ''}`}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                      aria-label={`Sort by ${column.header}`}
                    >
                      {column.header}
                      {isSorted ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3 w-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-slate-300" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
          {sortedRows.map((row) => {
            const key = rowKey(row);
            const isExpanded = expandedKey === key;
            return (
              <RowGroup key={key}>
                <tr
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    renderExpanded ? 'cursor-pointer' : ''
                  } ${isExpanded ? 'bg-blue-50/50' : ''}`}
                  onClick={
                    renderExpanded
                      ? () => setExpandedKey(isExpanded ? null : key)
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-3 py-2 align-middle ${column.className ?? ''}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
                {renderExpanded && isExpanded && (
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <td colSpan={columns.length} className="px-3 py-3">
                      {renderExpanded(row)}
                    </td>
                  </tr>
                )}
              </RowGroup>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
