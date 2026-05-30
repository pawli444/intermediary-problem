import React, { useState } from 'react';
import InputPanel from './components/InputPanel';
import ProfitTable from './components/ProfitTable';
import MaxCornerStepView from './components/MaxCornerStepView';
import ModiIterationView from './components/ModiIterationView';
import type { InputData, ExtendedTable, MaxCornerStep, ModiIteration } from './types';
import { buildExtended, runMaxCorner, runModi, EXAMPLE } from './utils/algorithm';

type Phase = 'input' | 'profit' | 'maxcorner' | 'modi';

const App: React.FC = () => {
  const [data, setData] = useState<InputData>(EXAMPLE);
  const [extended, setExtended] = useState<ExtendedTable | null>(null);
  const [maxSteps, setMaxSteps] = useState<MaxCornerStep[]>([]);
  const [modiIters, setModiIters] = useState<ModiIteration[]>([]);
  const [phase, setPhase] = useState<Phase>('input');
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    const { nD, nO, supply, demand, purchaseCost, salePrice, transport } = data;
    for (let i = 0; i < nD; i++) {
      if (!supply[i] || supply[i] <= 0) return `Brakuje podaży D${i + 1}`;
      if (!purchaseCost[i] && purchaseCost[i] !== 0) return `Brakuje kz D${i + 1}`;
    }
    for (let j = 0; j < nO; j++) {
      if (!demand[j] || demand[j] <= 0) return `Brakuje popytu O${j + 1}`;
      if (!salePrice[j] && salePrice[j] !== 0) return `Brakuje ceny O${j + 1}`;
    }
    for (let i = 0; i < nD; i++)
      for (let j = 0; j < nO; j++)
        if (transport[i]?.[j] === undefined) return `Brakuje kt D${i + 1}→O${j + 1}`;
    return null;
  };

  const handleRun = () => {
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }

    const ext = buildExtended(data);
    setExtended(ext);

    const steps = runMaxCorner(ext, data.prioritySuppliers, data.priorityReceivers);
    setMaxSteps(steps);

    const lastAlloc = steps[steps.length - 1]?.alloc ?? [];
    const modiResults = runModi(lastAlloc, ext.profit, ext.nRows, ext.nCols);
    setModiIters(modiResults);

    setPhase('profit');
  };

  const loadExample = () => {
    setData(EXAMPLE);
    setExtended(null);
    setMaxSteps([]);
    setModiIters([]);
    setPhase('input');
    setError(null);
  };

  const finalModi = modiIters[modiIters.length - 1];

  const Tab: React.FC<{ id: Phase; label: string; disabled?: boolean }> = ({ id, label, disabled }) => (
    <button
      style={{
        ...s.tab,
        borderBottom: phase === id ? '2px solid #1d4ed8' : '2px solid transparent',
        color: phase === id ? '#1d4ed8' : disabled ? '#d1d5db' : '#6b7280',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: phase === id ? 600 : 400,
      }}
      onClick={() => !disabled && setPhase(id)}
      disabled={disabled}
    >
      {label}
    </button>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.h1}>Zagadnienie Pośrednika</h1>
          <p style={s.sub}>Algorytm: max wierzchołka macierzy + MODI | Maksymalizacja zysku</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <Tab id="input" label="1. Dane wejściowe" />
          <Tab id="profit" label="2. Tablica zysków (z)" disabled={!extended} />
          <Tab id="maxcorner" label="3. Max wierzchołek" disabled={maxSteps.length === 0} />
          <Tab id="modi" label="4. MODI" disabled={modiIters.length === 0} />
        </div>

        {/* Content */}
        <div style={s.content}>

          {/* ── FAZA 1: Dane wejściowe ── */}
          {phase === 'input' && (
            <>
              <InputPanel data={data} onChange={setData} />
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={s.btnPrimary} onClick={handleRun}>▶ Uruchom algorytm</button>
                <button style={s.btnSec} onClick={loadExample}>Załaduj przykład (Zadanie 1)</button>
              </div>
              {error && <div style={s.error}>{error}</div>}
              <div style={s.hint}>
                <strong>Priorytety:</strong> kliknij nazwę dostawcy lub odbiorcy (⭐) — jego trasy
                będą rozpatrywane w pierwszej kolejności w metodzie max wierzchołka.<br />
                <strong>Blokowanie trasy:</strong> kliknij komórkę kosztu transportu (🚫) — trasa
                dostaje z = −M i nigdy nie wejdzie do rozwiązania.
              </div>
            </>
          )}

          {/* ── FAZA 2: Tablica zysków ── */}
          {phase === 'profit' && extended && (
            <>
              <div style={s.desc}>
                Zysk jednostkowy: <strong>z = c − kz − kt</strong>.
                FD i FO mają z=0. Zablokowane trasy: z=−M.
              </div>
              <ProfitTable table={extended} />
              <button style={{ ...s.btnPrimary, marginTop: 12 }} onClick={() => setPhase('maxcorner')}>
                Dalej → Max wierzchołek →
              </button>
            </>
          )}

          {/* ── FAZA 3: Max wierzchołek ── */}
          {phase === 'maxcorner' && extended && (
            <>
              <div style={s.desc}>
                Metoda maksymalnego wierzchołka macierzy zysku.
                W każdej iteracji wybieramy komórkę o <strong>najwyższym z</strong>, przydzielamy maks. ilość.
              </div>
              {maxSteps.map(step => (
                <MaxCornerStepView key={step.step} step={step} table={extended} />
              ))}
              <button style={{ ...s.btnPrimary, marginTop: 4 }} onClick={() => setPhase('modi')}>
                Dalej → MODI →
              </button>
            </>
          )}

          {/* ── FAZA 4: MODI ── */}
          {phase === 'modi' && extended && (
            <>
              <div style={s.desc}>
                Metoda MODI: <strong>z<sub>ij</sub> = u<sub>i</sub> + v<sub>j</sub></strong> dla bazowych,{' '}
                <strong>D<sub>ij</sub> = z<sub>ij</sub> − u<sub>i</sub> − v<sub>j</sub></strong> dla niebazowych.
                Jeśli D<sub>ij</sub> &gt; 0 → nie optymalnie, wybieramy pętlę zmian.
              </div>
              {modiIters.map((iter, idx) => (
                <ModiIterationView key={idx} iter={iter} table={extended} iterIndex={idx + 1} />
              ))}
              {finalModi?.isOptimal && (
                <div style={s.result}>
                  <div style={s.resultTitle}>✓ Rozwiązanie optymalne</div>
                  <div style={s.resultSub}>Maksymalny zysk całkowity:</div>
                  <div style={s.resultVal}>{finalModi.totalProfit.toFixed(0)}</div>
                  <div style={{ ...s.resultSub, marginTop: 12 }}>Plan dostaw (bez FD/FO):</div>
                  {finalModi.alloc.flatMap((row, i) =>
                    row.map((x, j) => {
                      if (x <= 0) return null;
                      if (extended.isFDRow[i] || extended.isFOCol[j]) return null;
                      return (
                        <div key={`${i}-${j}`} style={s.allocRow}>
                          <span>D{i + 1} → O{j + 1}</span>
                          <span>{x} jedn. × z={extended.profit[i][j]} = {x * extended.profit[i][j]}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              <button style={{ ...s.btnSec, marginTop: 12 }} onClick={() => setPhase('input')}>
                ← Wróć do danych
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f3f4f6', padding: '1.5rem 1rem', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" },
  container: { maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  header: { marginBottom: 12 },
  h1: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7280', margin: 0 },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto' },
  tab: { background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  content: {},
  desc: { fontSize: 13, color: '#6b7280', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', marginBottom: 12 },
  hint: { marginTop: 12, fontSize: 12, color: '#6b7280', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' },
  btnPrimary: { background: '#1d4ed8', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  btnSec: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  error: { marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
  result: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem', marginTop: 12 },
  resultTitle: { fontSize: 15, fontWeight: 600, color: '#16a34a', marginBottom: 8 },
  resultSub: { fontSize: 13, color: '#6b7280' },
  resultVal: { fontSize: 28, fontWeight: 700, color: '#15803d', margin: '4px 0 8px' },
  allocRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid #d1fae5' },
};

export default App;
