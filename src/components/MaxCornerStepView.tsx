import React from 'react';
import type { MaxCornerStep, ExtendedTable } from '../types';
import './MaxCornerStepView.css';

interface Props {
  step: MaxCornerStep;
  table: ExtendedTable;
}

const MaxCornerStepView: React.FC<Props> = ({ step, table }) => {
  const { nRows, nCols, profit, isFDRow, isFOCol, isBlockedCell, supply: origSupply, demand: origDemand } = table;
  const { selI, selJ, selProfit, amount, alloc, remSupply, remDemand, activeRows, activeCols, removedRow, removedCol } = step;

  const rowLabel = (i: number) => isFDRow[i] ? 'FD' : `D${i + 1}`;
  const colLabel = (j: number) => isFOCol[j] ? 'FO' : `O${j + 1}`;

  const removed = [];
  if (removedRow !== null) removed.push(`Usunięto wiersz ${rowLabel(removedRow)}`);
  if (removedCol !== null) removed.push(`Usunięto kolumnę ${colLabel(removedCol)}`);

  return (
    <div className="mc-block">
      <div className="mc-header">
        <span className="mc-badge">Iteracja {step.step}</span>
        <span className="mc-info">
          Wybrany: <strong>{rowLabel(selI)}→{colLabel(selJ)}</strong> (z={selProfit}), przydział={amount}
          {removed.length > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>| {removed.join(' | ')}</span>}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th className="th"></th>
              {Array.from({ length: nCols }, (_, j) => (
                <th key={j} className="th" style={{ color: activeCols.has(j) ? '#374151' : '#d1d5db', textDecoration: !activeCols.has(j) ? 'line-through' : undefined }}>
                  {colLabel(j)}
                </th>
              ))}
              <th className="th">Podaż</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nRows }, (_, i) => (
              <tr key={i}>
                <th className="th" style={{ color: activeRows.has(i) ? '#374151' : '#d1d5db', textDecoration: !activeRows.has(i) ? 'line-through' : undefined }}>
                  {rowLabel(i)}
                </th>
                {Array.from({ length: nCols }, (_, j) => {
                  const isSel = i === selI && j === selJ;
                  const hasAlloc = alloc[i][j] > 0;
                  const isBlocked = isBlockedCell[i][j];
                  let bg = 'transparent', outline = 'none', color = '#374151';
                  if (isBlocked) { bg = '#fef2f2'; color = '#dc2626'; }
                  else if (isSel) { bg = '#dcfce7'; outline = '2px solid #1d4ed8'; }
                  else if (hasAlloc) { bg = '#dcfce7'; }
                  const pVal = profit[i][j];
                  const pDisplay = isBlocked ? '-M' : pVal > 0 ? `+${pVal}` : String(pVal);
                  return (
                    <td key={j} className="td" style={{ background: bg, outline, outlineOffset: isSel ? -2 : undefined, color }}>
                      <div style={{ fontWeight: isSel ? 700 : 400 }}>{pDisplay}</div>
                      {alloc[i][j] > 0 && <div style={{ fontSize: 10, color: '#16a34a' }}>[{alloc[i][j]}]</div>}
                    </td>
                  );
                })}
                <td className="td" style={{ background: '#f9fafb', fontSize: 11 }}>
                  {origSupply[i]}<br />
                  <span style={{ color: '#9ca3af' }}>-{origSupply[i] - remSupply[i]}={remSupply[i]}</span>
                </td>
              </tr>
            ))}
            <tr>
              <th className="th">Popyt</th>
              {Array.from({ length: nCols }, (_, j) => (
                <td key={j} className="td" style={{ background: '#f9fafb', fontSize: 11 }}>
                  {origDemand[j]}<br />
                  <span style={{ color: '#9ca3af' }}>-{origDemand[j] - remDemand[j]}={remDemand[j]}</span>
                </td>
              ))}
              <td className="td"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  block: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', marginBottom: 12, background: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  badge: { background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  info: { fontSize: 12, color: '#6b7280' },
  tbl: { borderCollapse: 'collapse', fontSize: 12 },
  th: { border: '1px solid #e5e7eb', padding: '4px 9px', background: '#f9fafb', fontWeight: 500, textAlign: 'center', minWidth: 46 },
  td: { border: '1px solid #e5e7eb', padding: '4px 9px', textAlign: 'center', minWidth: 46 },
};

export default MaxCornerStepView;
