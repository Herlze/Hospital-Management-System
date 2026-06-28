import { ReactNode } from "react";
import { Search, Download, Filter } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchable?: boolean;
  exportable?: boolean;
  onRowClick?: (row: any) => void;
}

export const DataTable = ({ 
  columns, 
  data, 
  searchable = true, 
  exportable = true,
  onRowClick 
}: DataTableProps) => {
  return (
    <GlassCard className="overflow-hidden">
      {(searchable || exportable) && (
        <div className="p-4 border-b border-[rgba(148,163,184,0.2)] flex items-center justify-between gap-4">
          {searchable && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#0ea5e9] transition-all"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {exportable && (
              <>
                <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(148,163,184,0.1)] text-white rounded-lg hover:bg-[rgba(148,163,184,0.2)] transition-all">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Export</span>
                </button>
                <button className="p-2 bg-[rgba(148,163,184,0.1)] text-white rounded-lg hover:bg-[rgba(148,163,184,0.2)] transition-all">
                  <Filter className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[rgba(148,163,184,0.05)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-sm font-semibold text-white"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`border-t border-[rgba(148,163,184,0.1)] hover:bg-[rgba(148,163,184,0.05)] transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-white">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-[#94a3b8]">No data available</p>
        </div>
      )}
    </GlassCard>
  );
};
