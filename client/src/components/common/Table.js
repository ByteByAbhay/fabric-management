import React, { useState, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  emptyMessage = 'No items found',
  initialSortField,
  initialSortDirection = 'asc',
  className = '',
  rowClassName = '',
  headerClassName = '',
}) => {
  const [sortColumn, setSortColumn] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [sortedData, setSortedData] = useState([]);

  // Effect to sort data when props change
  useEffect(() => {
    if (!data || data.length === 0) {
      setSortedData([]);
      return;
    }

    let sorted = [...data];

    if (sortColumn) {
      sorted = sorted.sort((a, b) => {
        // Try to find the field in the column definition
        const column = columns.find(col => col.field === sortColumn);
        
        // Use the column's sortAccessor if provided
        const aValue = column?.sortAccessor ? column.sortAccessor(a) : a[sortColumn];
        const bValue = column?.sortAccessor ? column.sortAccessor(b) : b[sortColumn];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Sort based on value type
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    setSortedData(sorted);
  }, [data, sortColumn, sortDirection, columns]);

  // Handle column header click for sorting
  const handleSort = (field) => {
    if (field === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (field) => {
    if (field !== sortColumn) return null;
    
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDownIcon className="ml-1 h-4 w-4 inline" />
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={`bg-gray-50 ${headerClassName}`}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.field || column.header}
                onClick={column.sortable ? () => handleSort(column.field) : undefined}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                } ${column.className || ''}`}
                style={column.width ? { width: column.width } : {}}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && getSortIcon(column.field)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
              } ${rowClassName}`}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    column.cellClassName || 'text-gray-500'
                  }`}
                >
                  {column.render
                    ? column.render(row, rowIndex)
                    : row[column.field] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table; 