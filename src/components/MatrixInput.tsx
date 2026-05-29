import React from 'react';
import type { CellKey } from '../types/transport';
import { cellKey } from '../utils/algorithm';

interface Props {
  nD: number;
  nO: number;
  costs: number[][];
  supply: number[];
  demand: number[];
  blocked: Set<CellKey>;
  blockMode: boolean;
  onCostChange: (i: number, j: number, value: number) => void;
  onSupplyChange: (i: number, value: number) => void;
  onDemandChange: (j: number, value: number) => void;
  onToggleBlock: (i: number, j: number) => void;
}

const MatrixInput: React.FC<Props> = ({
  nD, nO, costs, supply, demand, blocked, blockMode,
  onCostChange, onSupplyChange, onDemandChange, onToggleBlock,
}) => {
  const totalSupply = supply.reduce((a, b) => a + (b || 0), 0);
  const totalDemand = demand.reduce((a, b) => a + (b || 0), 0);
  const balanced = Math.abs(totalSupply - totalDemand) < 0.001;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}></th>
            {Array.from({ length: nO }, (_, j) => (
              <th key={j} style={styles.th}>O{j + 1}</th>
            ))}
            <th style={{ ...styles.th, color: '#6b7280' }}>Podaż</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: nD }, (_, i) => (
            <tr key={i}>
              <th style={styles.th}>D{i + 1}</th>
              {Array.from({ length: nO }, (_, j) => {
                const isBlocked = blocked.has(cellKey(i, j));
                return (
                  <td
                    key={j}
                    style={{
                      ...styles.td,
                      background: isBlocked ? '#fef2f2' : undefined,
                      cursor: blockMode ? 'pointer' : undefined,
                      position: 'relative',
                    }}
                    onContextMenu={(e) => { e.preventDefault(); onToggleBlock(i, j); }}
                    onClick={() => { if (blockMode) onToggleBlock(i, j); }}
                    title={isBlocked ? 'Trasa zablokowana (kliknij aby odblokować)' : blockMode ? 'Kliknij aby zablokować' : 'PPM aby zablokować'}
                  >
                    {isBlocked ? (
                      <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 500 }}>🚫</span>
                    ) : (
                      <input
                        type="number"
                        value={costs[i]?.[j] ?? ''}
                        onChange={(e) => onCostChange(i, j, parseFloat(e.target.value))}
                        style={styles.cellInput}
                        min={0}
                        placeholder="k"
                      />
                    )}
                  </td>
                );
              })}
              <td style={{ ...styles.td, background: '#f9fafb' }}>
                <input
                  type="number"
                  value={supply[i] ?? ''}
                  onChange={(e) => onSupplyChange(i, parseFloat(e.target.value))}
                  style={{ ...styles.cellInput, fontWeight: 500 }}
                  min={1}
                  placeholder="S"
                />
              </td>
            </tr>
          ))}
          <tr>
            <th style={styles.th}>Popyt</th>
            {Array.from({ length: nO }, (_, j) => (
              <td key={j} style={{ ...styles.td, background: '#f9fafb' }}>
                <input
                  type="number"
                  value={demand[j] ?? ''}
                  onChange={(e) => onDemandChange(j, parseFloat(e.target.value))}
                  style={{ ...styles.cellInput, fontWeight: 500 }}
                  min={1}
                  placeholder="D"
                />
              </td>
            ))}
            <td style={{ ...styles.td, background: '#f9fafb', fontSize: 12 }}>
              <div style={{ lineHeight: 1.4, textAlign: 'center' }}>
                <div style={{ color: balanced ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                  Σ={totalSupply}
                </div>
                <div style={{ color: balanced ? '#16a34a' : '#dc2626', fontSize: 11 }}>
                  {balanced ? '✓ zbal.' : `≠ ${totalDemand}`}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  table: {
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: 'auto',
  },
  th: {
    border: '1px solid #e5e7eb',
    padding: '6px 10px',
    textAlign: 'center',
    background: '#f9fafb',
    fontWeight: 500,
    color: '#6b7280',
    minWidth: 54,
    whiteSpace: 'nowrap',
  },
  td: {
    border: '1px solid #e5e7eb',
    padding: '4px 6px',
    textAlign: 'center',
    minWidth: 54,
  },
  cellInput: {
    width: 52,
    border: 'none',
    background: 'transparent',
    textAlign: 'center',
    fontSize: 13,
    color: '#111827',
    outline: 'none',
    padding: '2px 0',
  },
};

export default MatrixInput;
