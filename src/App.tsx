import React, { useState, useCallback } from 'react';
import MatrixInput from './components/MatrixInput';
import IterationTable from './components/IterationTable';
import FinalResult from './components/FinalResult';
import type { AlgorithmResult, CellKey } from './types/transport';
import { runMaxCornerMethod, EXAMPLE_PRESET, cellKey } from './utils/algorithm';

const MAX_DIM = 10;
const MIN_DIM = 2;

function makeMatrix(nD: number, nO: number): number[][] {
  return Array.from({ length: nD }, () => Array(nO).fill(0));
}

const App: React.FC = () => {
  const [nD, setND] = useState(3);
  const [nO, setNO] = useState(4);
  const [costs, setCosts] = useState<number[][]>(makeMatrix(3, 4));
  const [supply, setSupply] = useState<number[]>(Array(3).fill(0));
  const [demand, setDemand] = useState<number[]>(Array(4).fill(0));
  const [blocked, setBlocked] = useState<Set<CellKey>>(new Set());
  const [blockMode, setBlockMode] = useState(false);
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyDimensions = useCallback((newD: number, newO: number) => {
    setCosts((prev) =>
      Array.from({ length: newD }, (_, i) =>
        Array.from({ length: newO }, (_, j) => prev[i]?.[j] ?? 0)
      )
    );
    setSupply((prev) => Array.from({ length: newD }, (_, i) => prev[i] ?? 0));
    setDemand((prev) => Array.from({ length: newO }, (_, j) => prev[j] ?? 0));
    setBlocked(new Set());
    setResult(null);
    setError(null);
  }, []);

  const handleSetND = (val: number) => {
    const clamped = Math.max(MIN_DIM, Math.min(MAX_DIM, val));
    setND(clamped);
    applyDimensions(clamped, nO);
  };

  const handleSetNO = (val: number) => {
    const clamped = Math.max(MIN_DIM, Math.min(MAX_DIM, val));
    setNO(clamped);
    applyDimensions(nD, clamped);
  };

  const handleCostChange = (i: number, j: number, value: number) => {
    setCosts((prev) => {
      const next = prev.map((r) => [...r]);
      next[i][j] = isNaN(value) ? 0 : value;
      return next;
    });
  };

  const handleSupplyChange = (i: number, value: number) => {
    setSupply((prev) => {
      const next = [...prev];
      next[i] = isNaN(value) ? 0 : value;
      return next;
    });
  };

  const handleDemandChange = (j: number, value: number) => {
    setDemand((prev) => {
      const next = [...prev];
      next[j] = isNaN(value) ? 0 : value;
      return next;
    });
  };

  const handleToggleBlock = (i: number, j: number) => {
    const key = cellKey(i, j);
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const loadExample = () => {
    const p = EXAMPLE_PRESET;
    setND(p.nD);
    setNO(p.nO);
    setCosts(p.costs.map((r) => [...r]));
    setSupply([...p.supply]);
    setDemand([...p.demand]);
    setBlocked(new Set());
    setResult(null);
    setError(null);
  };

  const runAlgorithm = () => {
    setError(null);
    setResult(null);

    for (let i = 0; i < nD; i++) {
      if (!supply[i] || supply[i] <= 0)
        return setError(`Brakuje podaży dla D${i + 1}`);
    }
    for (let j = 0; j < nO; j++) {
      if (!demand[j] || demand[j] <= 0)
        return setError(`Brakuje popytu dla O${j + 1}`);
    }

    const totalS = supply.reduce((a, b) => a + b, 0);
    const totalD = demand.reduce((a, b) => a + b, 0);
    if (Math.abs(totalS - totalD) > 0.001)
      return setError(
        `Problem niezbalansowany: suma podaży (${totalS}) ≠ suma popytu (${totalD})`
      );

    const res = runMaxCornerMethod({ costs, supply, demand, blocked });

    if (res.iterations.length === 0)
      return setError('Nie można znaleźć rozwiązania — wszystkie trasy mogą być zablokowane.');

    setResult(res);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.h1}>Metoda Maksymalnego Wierzchołka Macierzy</h1>
          <p style={styles.subtitle}>Problem transportowy — wyznaczanie bazowego rozwiązania dopuszczalnego</p>
        </div>

        {/* Dimensions */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Wymiary macierzy</div>
          <div style={styles.row}>
            <label style={styles.label}>Dostawców (D)</label>
            <input
              type="number"
              value={nD}
              min={MIN_DIM}
              max={MAX_DIM}
              onChange={(e) => handleSetND(parseInt(e.target.value))}
              style={styles.dimInput}
            />
            <label style={styles.label}>Odbiorców (O)</label>
            <input
              type="number"
              value={nO}
              min={MIN_DIM}
              max={MAX_DIM}
              onChange={(e) => handleSetNO(parseInt(e.target.value))}
              style={styles.dimInput}
            />
            <button style={styles.btnSecondary} onClick={loadExample}>
              Załaduj przykład
            </button>
          </div>
        </section>

        {/* Matrix */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Macierz kosztów, podaże i popyt</div>
          <MatrixInput
            nD={nD}
            nO={nO}
            costs={costs}
            supply={supply}
            demand={demand}
            blocked={blocked}
            blockMode={blockMode}
            onCostChange={handleCostChange}
            onSupplyChange={handleSupplyChange}
            onDemandChange={handleDemandChange}
            onToggleBlock={handleToggleBlock}
          />

          <div style={styles.hint}>
            💡 Prawy przycisk myszy na komórce kosztu — zablokuj/odblokuj trasę
          </div>

          <div style={styles.btnRow}>
            <button style={styles.btnPrimary} onClick={runAlgorithm}>
              ▶ Uruchom algorytm
            </button>
            <button
              style={blockMode ? styles.btnDangerActive : styles.btnDanger}
              onClick={() => setBlockMode((v) => !v)}
            >
              🚫 {blockMode ? 'Wyłącz tryb blokowania' : 'Tryb blokowania tras'}
            </button>
          </div>

          {blockMode && (
            <div style={styles.blockModeInfo}>
              Tryb blokowania aktywny — kliknij komórkę kosztu, aby zablokować/odblokować trasę.
            </div>
          )}

          {error && <div style={styles.errorMsg}>{error}</div>}
        </section>

        {/* Results */}
        {result && (
          <>
            <section style={styles.section}>
              <div style={styles.sectionTitle}>
                Przebieg algorytmu — {result.iterations.length} iteracji
              </div>
              {result.iterations.map((it) => (
                <IterationTable
                  key={it.step}
                  iteration={it}
                  costs={costs}
                  supply={supply}
                  demand={demand}
                  blocked={blocked}
                  nD={nD}
                  nO={nO}
                />
              ))}
            </section>

            <section style={styles.section}>
              <div style={styles.sectionTitle}>Rozwiązanie końcowe</div>
              <FinalResult result={result} costs={costs} />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: '2rem 1rem',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  container: {
    maxWidth: 860,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 16,
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  header: { marginBottom: '1.5rem' },
  h1: { fontSize: 20, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', margin: 0 },
  section: { marginBottom: '2rem' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.75rem',
  },
  row: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  label: { fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' },
  dimInput: {
    width: 64,
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '1rem' },
  btnPrimary: {
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  btnSecondary: {
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnDanger: {
    background: '#fff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnDangerActive: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #dc2626',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  blockModeInfo: {
    marginTop: 8,
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 6,
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
  },
  errorMsg: {
    marginTop: 10,
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 6,
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
  },
};

export default App;
