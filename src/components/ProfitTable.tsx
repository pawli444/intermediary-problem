import React from 'react';
import type { ExtendedTable } from '../types';
import { BIG_M } from '../utils/algorithm';
import './ProfitTable.css';

interface Props { table: ExtendedTable; }

const ProfitTable: React.FC<Props> = ({ table }) => {
  const { nRows, nCols, profit, supply, demand, isBlockedCell, isFDRow, isFOCol } = table;

  return (
    <div className="overflow-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th className="th" />
            {Array.from({ length: nCols }, (_, j) => (
              <th key={j} className="th" style={{ color: isFOCol[j] ? '#9ca3af' : '#374151' }}>
                {isFOCol[j] ? 'FO' : `O${j + 1}`}
              </th>
            ))}
            <th className="th">Podaż</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: nRows }, (_, i) => (
            <tr key={i}>
              <th className="th" style={{ color: isFDRow[i] ? '#9ca3af' : '#374151' }}>{isFDRow[i] ? 'FD' : `D${i + 1}`}</th>
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
                  <td key={j} className="td" style={{ background: bg, color, fontWeight: (isFD || isFO) ? 400 : 500 }}>
                    {isBlocked ? <span title={`-${BIG_M}`}>-M</span> : display}
                  </td>
                );
              })}
              <td className="td" style={{ color: '#6b7280' }}>{supply[i]}</td>
            </tr>
          ))}
          <tr>
            <th className="th">Popyt</th>
            {Array.from({ length: nCols }, (_, j) => (
              <td key={j} className="td" style={{ color: '#6b7280' }}>{demand[j]}</td>
            ))}
            <td className="td" />
          </tr>
        </tbody>
      </table>
      <div className="muted-note">
        z = c − kz − kt &nbsp;|&nbsp; FD = fikcyjny dostawca &nbsp;|&nbsp; FO = fikcyjny odbiorca &nbsp;|&nbsp; -M = trasa zablokowana
      </div>
    </div>
  );
};
export default ProfitTable;

