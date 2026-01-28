import React from "react";

export interface TableColumn {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
}

const ReusableTable: React.FC<TableProps> = ({ columns, data }) => {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="min-w-full divide-y divide-gray-200 table-auto mt-4">
        <thead >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReusableTable;