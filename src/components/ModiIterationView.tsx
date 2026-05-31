import React from 'react';
import './ModiIterationView.css';
import type { ModiIteration, ExtendedTable } from '../types';
import { BIG_M } from '../utils/algorithm';

interface Props {
  iter: ModiIteration;
  table: ExtendedTable;
  iterIndex: number;
}

const ModiIterationView: React.FC<Props> = ({ iter, table, iterIndex }) => {
  const { nRows, nCols, isFDRow, isFOCol, profit, isBlockedCell } = table;
  const { u, v, D, alloc, basis, enterI, enterJ, loop, loopDelta, isOptimal, totalProfit } = iter;

  const rowLabel = (i: number) => isFDRow[i] ? 'FD' : `D${i + 1}`;
  const colLabel = (j: number) => isFOCol[j] ? 'FO' : `O${j + 1}`;

  const loopIndexMap = new Map(loop?.map(([i, j], k) => [`${i},${j}`, k]) ?? []);
  const loopMinus = new Set(loop?.filter((_, k) => k % 2 === 1).map(([i, j]) => `${i},${j}`) ?? []);

  const loopSteps = loop && loop.length > 0 ? (
    <div className="loop-viz">
      <span className="loop-title">Pętla zmian (δ={loopDelta}):</span>
      <div className="loop-steps">
        {loop.map(([i, j], k) => {
          const isMinus = k % 2 === 1;
          const isFirst = k === 0;
          return (
            <React.Fragment key={k}>
              {k > 0 && <span className="arrow">→</span>}
              <span className="loop-cell" style={{
                background: isFirst ? '#fef9c3' : isMinus ? '#fee2e2' : '#dcfce7',
                border: isFirst ? '1px solid #f59e0b' : isMinus ? '1px solid #ef4444' : '1px solid #22c55e',
                color: isFirst ? '#92400e' : isMinus ? '#991b1b' : '#166534',
              }}>
                <span className="step-index">{k + 1}.</span>
                {rowLabel(i)}→{colLabel(j)}
                <span className="step-sign">{isFirst ? '(+)' : isMinus ? '(−)' : '(+)'}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <div className="muted-small">δ = min alokacji na komórkach (−) = {loopDelta}</div>
    </div>
  ) : null;

  return (
    <div className="modi-block">
      <div className="modi-header">
        <span className="modi-badge" style={{ background: isOptimal ? '#f0fdf4' : '#eff6ff', color: isOptimal ? '#16a34a' : '#1d4ed8' }}>
          {isOptimal ? '✓ Optimum' : `Iteracja MODI ${iterIndex}`}
        </span>
        {!isOptimal && enterI !== null && enterJ !== null && (
          <span className="modi-info">
            Komórka wchodząca: <strong>{rowLabel(enterI!)}→{colLabel(enterJ!)}</strong>
            {' '}(D={D[enterI!]?.[enterJ!]?.toFixed(2)})
            {loopDelta !== null && <span style={{ color: '#7c3aed', marginLeft: 6 }}>δ={loopDelta}</span>}
          </span>
        )}
        {isOptimal && (
          <span className="modi-info" style={{ color: '#16a34a', fontWeight: 500 }}>
            Wszystkie D ≤ 0 — rozwiązanie optymalne. Zysk = <strong>{totalProfit.toFixed(0)}</strong>
          </span>
        )}
      </div>

      <div className="uv-row">
        <span className="uv-label">Zmienne dualne:</span>
        {Array.from({ length: nRows }, (_, i) => (
          <span key={i} className="uv-chip">
            α<sub>{isFDRow[i] ? 'FD' : i + 1}</sub> = {u[i] !== null ? u[i]!.toFixed(1) : '?'}
          </span>
        ))}
        {Array.from({ length: nCols }, (_, j) => (
          <span key={j} className="uv-chip" style={{ background: '#fff7ed', color: '#c2410c' }}>
            β<sub>{isFOCol[j] ? 'FO' : j + 1}</sub> = {v[j] !== null ? v[j]!.toFixed(1) : '?'}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th className="th" />
              {Array.from({ length: nCols }, (_, j) => (
                <th key={j} className="th">
                  <div>{colLabel(j)}</div>
                  <div style={{ fontSize: 10, color: '#c2410c', fontWeight: 500 }}>
                    β={v[j] !== null ? v[j]!.toFixed(1) : '?'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nRows }, (_, i) => (
              <tr key={i}>
                <th className="th">
                  <div>{rowLabel(i)}</div>
                  <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 500 }}>
                    α={u[i] !== null ? u[i]!.toFixed(1) : '?'}
                  </div>
                </th>
                {Array.from({ length: nCols }, (_, j) => {
                  const isBasis = basis[i][j];
                  const key = `${i},${j}`;
                  const loopIdx = loopIndexMap.get(key);
                  const inLoop = loopIdx !== undefined;
                  const isMinus = loopMinus.has(key);
                  const isEnter = i === enterI && j === enterJ;
                  const dVal = D[i]?.[j];
                  const isBlocked = isBlockedCell[i][j];
                  const profitVal = profit[i][j];
                  const uvSum = (u[i] !== null && v[j] !== null) ? u[i]! + v[j]! : null;

                  let bg = 'transparent';
                  let borderStyle = '1px solid #e5e7eb';
                  if (isEnter) { bg = '#fef9c3'; borderStyle = '2px solid #f59e0b'; }
                  else if (inLoop && isMinus) { bg = '#fee2e2'; borderStyle = '2px solid #ef4444'; }
                  else if (inLoop) { bg = '#dcfce7'; borderStyle = '2px solid #22c55e'; }
                  else if (isBasis) { bg = '#f0f9ff'; }
                  else if (isBlocked) { bg = '#fef2f2'; }

                  return (
                    <td key={j} className="td" style={{ background: bg, border: borderStyle, position: 'relative' }}>
                      {inLoop && loopIdx !== undefined && (
                        <div style={{ position: 'absolute', top: 2, left: 3, fontSize: 9, fontWeight: 700, color: isMinus ? '#ef4444' : isEnter ? '#d97706' : '#16a34a' }}>
                          {loopIdx + 1}{isMinus ? '−' : '+'}
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>{isBlocked ? '−∞' : `z=${profitVal}`}</div>

                      {isBasis && !isBlocked && (
                        <>
                          <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 14 }}>
                            {alloc[i][j]}
                            {inLoop && <span style={{ marginLeft: 2, fontSize: 11, color: isMinus ? '#ef4444' : '#22c55e' }}>{isMinus ? '−' : '+'}</span>}
                          </div>
                          {uvSum !== null && <div style={{ fontSize: 10, color: '#7c3aed' }}>α+β={uvSum.toFixed(1)}</div>}
                        </>
                      )}

                      {!isBasis && !isBlocked && dVal !== null && dVal !== undefined && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 600, color: dVal > 0 ? '#dc2626' : '#6b7280' }}>D={dVal.toFixed(1)}</div>
                          {isEnter && <div style={{ fontSize: 9, color: '#d97706' }}>↑ wchodzi</div>}
                        </>
                      )}

                      {isBlocked && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>🚫</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loopSteps}

      <div className="legend">
        <LegItem bg="#f0f9ff" border="1px solid #bae6fd" label="Bazowa (z + alloc + α+β)" />
        <LegItem bg="transparent" border="1px solid #e5e7eb" label="Niebazowa (z + D)" />
        <LegItem bg="#fef9c3" border="2px solid #f59e0b" label="Wchodząca (max D>0)" />
        <LegItem bg="#dcfce7" border="2px solid #22c55e" label="Pętla +" />
        <LegItem bg="#fee2e2" border="2px solid #ef4444" label="Pętla −" />
      </div>
    </div>
  );
};

const LegItem: React.FC<{ bg: string; border: string; label: string }> = ({ bg, border, label }) => (
  <span className="leg-item">
    <span className="leg-swatch" style={{ background: bg, border }} />
    {label}
  </span>
);

export default ModiIterationView;