import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ className = '', ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={`w-full text-sm text-left text-gray-500 ${className}`}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableHeader({ className = '', ...props }: TableHeaderProps) {
  return <thead className={`text-xs uppercase bg-gray-50 ${className}`} {...props} />;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableBody({ className = '', ...props }: TableBodyProps) {
  return <tbody className={`divide-y divide-gray-200 bg-white ${className}`} {...props} />;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export function TableRow({ className = '', ...props }: TableRowProps) {
  return <tr className={`hover:bg-gray-50 ${className}`} {...props} />;
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableHead({ className = '', ...props }: TableHeadProps) {
  return (
    <th
      className={`px-6 py-3 font-medium text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    />
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableCell({ className = '', ...props }: TableCellProps) {
  return <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props} />;
}