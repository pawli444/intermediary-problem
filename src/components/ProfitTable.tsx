import React from 'react';
import type { ExtendedTable } from '../types';
import { BIG_M } from '../utils/algorithm';

interface Props { table: ExtendedTable; }

const ProfitTable: React.FC<Props> = ({ table }) => {
  const { nRows, nCols, profit, supply, demand, isBlockedCell, isFDRow, isFOCol } = table;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.tbl}>
        <thead>
          <tr>
            <th style={s.th}></th>
            {Array.from({ length: nCols }, (_, j) => (
              <th key={j} style={{ ...s.th, color: isFOCol[j] ? '#9ca3af' : '#374151' }}>
                {isFOCol[j] ? 'FO' : `O${j + 1}`}
              </th>
            ))}
            <th style={s.th}>Podaż</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: nRows }, (_, i) => (
            <tr key={i}>
              <th style={{ ...s.th, color: isFDRow[i] ? '#9ca3af' : '#374151' }}>
                {isFDRow[i] ? 'FD' : `D${i + 1}`}
              </th>
              {Array.from({ length: nCols }, (_, j) => {
                const val = profit[i][j];
                const isBlocked = isBlockedCell[i][j];
                const isFD = isFDRow[i];
                const isFO = isFOCol[j];
                let bg = 'transparent';
                let color = '#111827';
                let display = String(val);
                if (isBlocked) { bg = '#fef2f2'; color = '#dc2626'; display = '-M'; }
                else if (isFD || isFO) { color = '#9ca3af'; }
                else if (val < 0) { color = '#dc2626'; }
                else if (val > 0) { color = '#16a34a'; }
                return (
                  <td key={j} style={{ ...s.td, background: bg, color, fontWeight: (isFD || isFO) ? 400 : 500 }}>
                    {isBlocked ? <span title={`-${BIG_M}`}>-M</span> : display}
                  </td>
                );
              })}
              <td style={{ ...s.td, color: '#6b7280' }}>{supply[i]}</td>
            </tr>
          ))}
          <tr>
            <th style={s.th}>Popyt</th>
            {Array.from({ length: nCols }, (_, j) => (
              <td key={j} style={{ ...s.td, color: '#6b7280' }}>{demand[j]}</td>
            ))}
            <td style={s.td}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
        z = c − kz − kt &nbsp;|&nbsp; FD = fikcyjny dostawca &nbsp;|&nbsp; FO = fikcyjny odbiorca &nbsp;|&nbsp; -M = trasa zablokowana
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  tbl: { borderCollapse: 'collapse', fontSize: 13 },
  th: { border: '1px solid #e5e7eb', padding: '5px 10px', background: '#f9fafb', fontWeight: 500, color: '#374151', textAlign: 'center', whiteSpace: 'nowrap' },
  td: { border: '1px solid #e5e7eb', padding: '5px 10px', textAlign: 'center', minWidth: 52 },
};

export default ProfitTable;
