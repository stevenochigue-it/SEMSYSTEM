import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm scrollbar-thin ${className}`}>
      <table className="w-full border-collapse text-left text-sm text-slate-600">
        <thead className="bg-slate-55/75 font-semibold text-slate-700 border-b border-slate-200">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <tr className={`hover:bg-slate-50/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  colSpan,
}) => {
  return (
    <td colSpan={colSpan} className={`px-6 py-4 align-middle text-slate-600 ${className}`}>
      {children}
    </td>
  );
};
