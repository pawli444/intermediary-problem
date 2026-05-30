import React from 'react';
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

  // Indeks w pętli (bez ostatniego duplikatu)
  const loopIndexMap = new Map(loop?.map(([i, j], k) => [`${i},${j}`, k]) ?? []);
  const loopMinus = new Set(loop?.filter((_, k) => k % 2 === 1).map(([i, j]) => `${i},${j}`) ?? []);

  // Wizualizacja pętli jako sekwencja kroków
  const loopSteps = loop && loop.length > 0 ? (
    <div style={s.loopViz}>
      <span style={s.loopTitle}>Pętla zmian (δ={loopDelta}):</span>
      <div style={s.loopSteps}>
        {loop.map(([i, j], k) => {
          const isMinus = k % 2 === 1;
          const isFirst = k === 0;
          return (
            <React.Fragment key={k}>
              {k > 0 && <span style={{ color: '#9ca3af', fontSize: 12 }}>→</span>}
              <span style={{
                ...s.loopCell,
                background: isFirst ? '#fef9c3' : isMinus ? '#fee2e2' : '#dcfce7',
                border: isFirst ? '1px solid #f59e0b' : isMinus ? '1px solid #ef4444' : '1px solid #22c55e',
                color: isFirst ? '#92400e' : isMinus ? '#991b1b' : '#166534',
              }}>
                <span style={{ fontWeight: 700, marginRight: 2 }}>{k + 1}.</span>
                {rowLabel(i)}→{colLabel(j)}
                <span style={{ fontWeight: 700, marginLeft: 2 }}>
                  {isFirst ? '(+)' : isMinus ? '(−)' : '(+)'}
                </span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
        δ = min alokacji na komórkach (−) = {loopDelta}
      </div>
    </div>
  ) : null;

  return (
    <div style={s.block}>
      {/* Nagłówek */}
      <div style={s.header}>
        <span style={{
          ...s.badge,
          background: isOptimal ? '#f0fdf4' : '#eff6ff',
          color: isOptimal ? '#16a34a' : '#1d4ed8',
        }}>
          {isOptimal ? '✓ Optimum' : `Iteracja MODI ${iterIndex}`}
        </span>
        {!isOptimal && enterI !== null && enterJ !== null && (
          <span style={s.info}>
            Komórka wchodząca: <strong>{rowLabel(enterI!)}→{colLabel(enterJ!)}</strong>
            {' '}(D={D[enterI!]?.[enterJ!]?.toFixed(2)})
            {loopDelta !== null && <span style={{ color: '#7c3aed', marginLeft: 6 }}>δ={loopDelta}</span>}
          </span>
        )}
        {isOptimal && (
          <span style={{ ...s.info, color: '#16a34a', fontWeight: 500 }}>
            Wszystkie D ≤ 0 — rozwiązanie optymalne. Zysk = <strong>{totalProfit.toFixed(0)}</strong>
          </span>
        )}
      </div>

      {/* Zmienne dualne */}
      <div style={s.uvRow}>
        <span style={s.uvLabel}>Zmienne dualne:</span>
        {Array.from({ length: nRows }, (_, i) => (
          <span key={i} style={s.uvChip}>
            α<sub>{isFDRow[i] ? 'FD' : i + 1}</sub> = {u[i] !== null ? u[i]!.toFixed(1) : '?'}
          </span>
        ))}
        {Array.from({ length: nCols }, (_, j) => (
          <span key={j} style={{ ...s.uvChip, background: '#fff7ed', color: '#c2410c' }}>
            β<sub>{isFOCol[j] ? 'FO' : j + 1}</sub> = {v[j] !== null ? v[j]!.toFixed(1) : '?'}
          </span>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={s.tbl}>
          <thead>
            <tr>
              <th style={s.th}></th>
              {Array.from({ length: nCols }, (_, j) => (
                <th key={j} style={s.th}>
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
                <th style={s.th}>
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

                  // Kolory tła
                  let bg = 'transparent';
                  let borderStyle = '1px solid #e5e7eb';
                  if (isEnter)                  { bg = '#fef9c3'; borderStyle = '2px solid #f59e0b'; }
                  else if (inLoop && isMinus)   { bg = '#fee2e2'; borderStyle = '2px solid #ef4444'; }
                  else if (inLoop)              { bg = '#dcfce7'; borderStyle = '2px solid #22c55e'; }
                  else if (isBasis)             { bg = '#f0f9ff'; }
                  else if (isBlocked)           { bg = '#fef2f2'; }

                  return (
                    <td key={j} style={{ ...s.td, background: bg, border: borderStyle, position: 'relative' }}>

                      {/* Numer kroku pętli */}
                      {inLoop && loopIdx !== undefined && (
                        <div style={{
                          position: 'absolute', top: 2, left: 3,
                          fontSize: 9, fontWeight: 700,
                          color: isMinus ? '#ef4444' : isEnter ? '#d97706' : '#16a34a',
                        }}>
                          {loopIdx + 1}{isMinus ? '−' : '+'}
                        </div>
                      )}

                      {/* Zysk jednostkowy z_ij */}
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>
                        {isBlocked ? '−∞' : `z=${profitVal}`}
                      </div>

                      {/* Bazowa: alokacja + u+v */}
                      {isBasis && !isBlocked && (
                        <>
                          <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 14 }}>
                            {alloc[i][j]}
                            {inLoop && (
                              <span style={{ marginLeft: 2, fontSize: 11, color: isMinus ? '#ef4444' : '#22c55e' }}>
                                {isMinus ? '−' : '+'}
                              </span>
                            )}
                          </div>
                          {uvSum !== null && (
                            <div style={{ fontSize: 10, color: '#7c3aed' }}>
                              α+β={uvSum.toFixed(1)}
                            </div>
                          )}
                        </>
                      )}

                      {/* Niebazowa: D_ij */}
                      {!isBasis && !isBlocked && dVal !== null && dVal !== undefined && (
                        <>
                          <div style={{
                            fontSize: 12, fontWeight: 600,
                            color: dVal > 0 ? '#dc2626' : '#6b7280',
                          }}>
                            D={dVal.toFixed(1)}
                          </div>
                          {isEnter && (
                            <div style={{ fontSize: 9, color: '#d97706' }}>↑ wchodzi</div>
                          )}
                        </>
                      )}

                      {/* Zablokowana */}
                      {isBlocked && (
                        <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>🚫</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wizualizacja pętli */}
      {loopSteps}

      {/* Legenda */}
      <div style={s.legend}>
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
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
    <span style={{ width: 10, height: 10, background: bg, border, borderRadius: 2, display: 'inline-block' }} />
    {label}
  </span>
);

const s: Record<string, React.CSSProperties> = {
  block: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', marginBottom: 12, background: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' },
  badge: { fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  info: { fontSize: 12, color: '#6b7280' },
  uvRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 },
  uvLabel: { fontSize: 11, color: '#9ca3af' },
  uvChip: { fontSize: 12, background: '#f5f3ff', color: '#7c3aed', padding: '1px 7px', borderRadius: 4 },
  tbl: { borderCollapse: 'collapse', fontSize: 12 },
  th: { border: '1px solid #e5e7eb', padding: '4px 8px', background: '#f9fafb', fontWeight: 500, textAlign: 'center', minWidth: 64 },
  td: { padding: '5px 8px', textAlign: 'center', minWidth: 64, verticalAlign: 'middle' },
  legend: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 },
  loopViz: { background: '#f9fafb', borderRadius: 8, padding: '8px 10px', marginTop: 8 },
  loopTitle: { fontSize: 11, fontWeight: 600, color: '#374151', marginRight: 8 },
  loopSteps: { display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 },
  loopCell: { fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, whiteSpace: 'nowrap' },
};

export default ModiIterationView;