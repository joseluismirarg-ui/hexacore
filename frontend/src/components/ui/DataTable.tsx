import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  compact?: boolean;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'Sin registros',
  compact = false,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/60 bg-hc-surface-dark">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`${cellPadding} text-left text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                }`}
                style={col.width ? { width: col.width } : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <ArrowUpDown className="h-3 w-3 text-gray-500" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/30">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`table-row-hover ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onRowClick) onRowClick(row);
                }}
              >
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={`${cellPadding} text-gray-300 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : ''
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(getNestedValue(row, col.accessor as string) ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
