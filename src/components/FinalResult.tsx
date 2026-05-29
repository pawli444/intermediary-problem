import React from 'react';
import type { AlgorithmResult } from '../types/transport';

interface Props {
  result: AlgorithmResult;
  costs: number[][];
}

const FinalResult: React.FC<Props> = ({ result }) => {
  return (
    <div style={styles.card}>
      <div style={styles.title}>Plan przydziałów</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Trasa</th>
            <th style={styles.th}>Ilość</th>
            <th style={styles.th}>Koszt jedn.</th>
            <th style={styles.th}>Koszt total</th>
          </tr>
        </thead>
        <tbody>
          {result.allocations.map(({ i, j, amount, cost }) => (
            <tr key={`${i}-${j}`}>
              <td style={styles.td}>
                <span style={styles.routeBadge}>D{i + 1} → O{j + 1}</span>
              </td>
              <td style={styles.td}>{amount}</td>
              <td style={styles.td}>{cost}</td>
              <td style={{ ...styles.td, fontWeight: 500 }}>{amount * cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.totalRow}>
        <span style={{ color: '#6b7280' }}>Całkowity koszt transportu:</span>
        <span style={styles.totalValue}>{result.totalCost}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#f9fafb',
    borderRadius: 12,
    padding: '1rem 1.25rem',
    border: '1px solid #e5e7eb',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 12,
    color: '#374151',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    marginBottom: 12,
  },
  th: {
    border: '1px solid #e5e7eb',
    padding: '6px 10px',
    textAlign: 'center',
    background: '#fff',
    fontWeight: 500,
    color: '#6b7280',
  },
  td: {
    border: '1px solid #e5e7eb',
    padding: '6px 10px',
    textAlign: 'center',
    background: '#fff',
  },
  routeBadge: {
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 12,
    fontSize: 14,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1d4ed8',
  },
};

export default FinalResult;
