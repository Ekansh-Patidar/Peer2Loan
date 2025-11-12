import React from 'react';
import './Table.css';

const Table = ({
  columns,
  data,
  onRowClick,
  striped = false,
  hoverable = true,
  bordered = false,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const tableClasses = [
    'table',
    striped && 'table-striped',
    hoverable && 'table-hoverable',
    bordered && 'table-bordered',
    compact && 'table-compact',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="table-loading">
        <div className="table-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                style={{ width: column.width }}
                className={column.align ? `text-${column.align}` : ''}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'table-row-clickable' : ''}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={column.key || colIndex}
                  className={column.align ? `text-${column.align}` : ''}
                >
                  {column.render
                    ? column.render(row[column.dataIndex], row, rowIndex)
                    : row[column.dataIndex]}
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
