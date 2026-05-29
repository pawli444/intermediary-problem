import React from 'react';
import type { IterationSnapshot } from '../types/transport';
import type { CellKey } from '../types/transport';
import { cellKey } from '../utils/algorithm';

interface Props {
  iteration: IterationSnapshot;
  costs: number[][];
  supply: number[];
  demand: number[];
  blocked: Set<CellKey>;
  nD: number;
  nO: number;
}

const IterationTable: React.FC<Props> = ({
  iteration: it, costs, supply, demand, blocked, nD, nO,
}) => {
  const removedInfo = [
    it.removedRow !== null ? `Usunięto wiersz D${it.removedRow + 1}` : '',
    it.removedCol !== null ? `Usunięto kolumnę O${it.removedCol + 1}` : '',
  ].filter(Boolean).join(' | ');

  return (
    <div style={styles.block}>
      <div style={styles.header}>
        <span style={styles.badge}>Iteracja {it.step}</span>
        <span style={styles.info}>
          Wybrany: <strong>D{it.maxI + 1}→O{it.maxJ + 1}</strong> (koszt={it.maxCost}), przydział={it.amount}
          {removedInfo && <span style={{ color: '#dc2626', marginLeft: 8 }}>| {removedInfo}</span>}
        </span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              {Array.from({ length: nO }, (_, j) => (
                <th
                  key={j}
                  style={{
                    ...styles.th,
                    color: it.activeCols.has(j) ? '#374151' : '#d1d5db',
                    textDecoration: !it.activeCols.has(j) ? 'line-through' : undefined,
                  }}
                >
                  O{j + 1}
                </th>
              ))}
              <th style={styles.th}>Podaż</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nD }, (_, i) => (
              <tr key={i}>
                <th
                  style={{
                    ...styles.th,
                    color: it.activeRows.has(i) ? '#374151' : '#d1d5db',
                    textDecoration: !it.activeRows.has(i) ? 'line-through' : undefined,
                  }}
                >
                  D{i + 1}
                </th>
                {Array.from({ length: nO }, (_, j) => {
                  const isMax = i === it.maxI && j === it.maxJ;
                  const isAlloc = it.alloc[i][j] > 0;
                  const isBlocked = blocked.has(cellKey(i, j));

                  let bg = 'transparent';
                  let color = '#111827';
                  let outline = 'none';
                  let textDeco: React.CSSProperties['textDecoration'] = undefined;

                  if (isBlocked) {
                    bg = '#fef2f2';
                    color = '#dc2626';
                    textDeco = 'line-through';
                  } else if (isMax) {
                    bg = '#dcfce7';
                    outline = '2px solid #2563eb';
                  } else if (isAlloc) {
                    bg = '#dcfce7';
                  }

                  return (
                    <td
                      key={j}
                      style={{
                        ...styles.td,
                        background: bg,
                        color,
                        outline,
                        outlineOffset: isMax ? -2 : undefined,
                        textDecoration: textDeco,
                        fontWeight: isMax ? 600 : isAlloc ? 500 : 400,
                      }}
                    >
                      {isBlocked ? '🚫' : costs[i][j]}
                      {!isBlocked && it.alloc[i][j] > 0 && (
                        <div style={{ fontSize: 10, color: '#16a34a', marginTop: 1 }}>
                          [{it.alloc[i][j]}]
                        </div>
                      )}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, background: '#f9fafb', fontSize: 12 }}>
                  <div>{supply[i]}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    -{supply[i] - it.remainingSupply[i]}={it.remainingSupply[i]}
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <th style={styles.th}>Popyt</th>
              {Array.from({ length: nO }, (_, j) => (
                <td key={j} style={{ ...styles.td, background: '#f9fafb', fontSize: 12 }}>
                  <div>{demand[j]}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    -{demand[j] - it.remainingDemand[j]}={it.remainingDemand[j]}
                  </div>
                </td>
              ))}
              <td style={{ ...styles.td, background: '#f9fafb' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.legend}>
        <LegendItem color="#dcfce7" border="2px solid #2563eb" label="Wybrany w tej iteracji" />
        <LegendItem color="#dcfce7" border="1px solid #86efac" label="Już przydzielony" />
        <LegendItem color="#fef2f2" border="1px solid #fca5a5" label="Zablokowana trasa" />
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; border: string; label: string }> = ({ color, border, label }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
    <span style={{ width: 10, height: 10, background: color, border, borderRadius: 2, display: 'inline-block' }} />
    {label}
  </span>
);

const styles: Record<string, React.CSSProperties> = {
  block: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '1rem',
    marginBottom: '1rem',
    background: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badge: {
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 6,
    whiteSpace: 'nowrap',
  },
  info: {
    fontSize: 12,
    color: '#6b7280',
  },
  table: {
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    border: '1px solid #e5e7eb',
    padding: '5px 9px',
    textAlign: 'center',
    background: '#f9fafb',
    fontWeight: 500,
    color: '#374151',
    minWidth: 48,
    whiteSpace: 'nowrap',
  },
  td: {
    border: '1px solid #e5e7eb',
    padding: '5px 9px',
    textAlign: 'center',
    minWidth: 48,
    transition: 'background 0.15s',
  },
  legend: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 6,
  },
};

export default IterationTable;
