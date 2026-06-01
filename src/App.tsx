import React, { useState } from 'react';
import './App.css';
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
      className={`tab ${phase === id ? 'tab--active' : ''} ${disabled ? 'tab--disabled' : ''}`}
      onClick={() => !disabled && setPhase(id)}
      disabled={disabled}
    >
      {label}
    </button>
  );

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="h1">Zagadnienie Pośrednika</h1>
          <p className="sub">Algorytm: max wierzchołka macierzy + MODI | Maksymalizacja zysku</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <Tab id="input" label="1. Dane wejściowe" />
          <Tab id="profit" label="2. Tablica zysków (z)" disabled={!extended} />
          <Tab id="maxcorner" label="3. Max wierzchołek" disabled={maxSteps.length === 0} />
          <Tab id="modi" label="4. MODI" disabled={modiIters.length === 0} />
        </div>

        {/* Content */}
        <div className="content">

          {/* ── FAZA 1: Dane wejściowe ── */}
          {phase === 'input' && (
            <>
              <InputPanel data={data} onChange={setData} />
              <div className="controls">
                <button className="btnPrimary" onClick={handleRun}>▶ Uruchom algorytm</button>
                <button className="btnSec" onClick={loadExample}>Załaduj przykład (Zadanie 1)</button>
              </div>
              {error && <div className="error">{error}</div>}
              <div className="hint">
                <strong>Blokowanie trasy:</strong> kliknij komórkę kosztu transportu (⭐)
              </div>
            </>
          )}

          {/* ── FAZA 2: Tablica zysków ── */}
          {phase === 'profit' && extended && (
            <>
              <div className="desc">
                Zysk jednostkowy: <strong>z = c − kz − kt</strong>.
                FD i FO mają z=0. Zablokowane trasy: z=−M.
              </div>
              <ProfitTable table={extended} />
              <button className="btnPrimary mt12" onClick={() => setPhase('maxcorner')}>
                Dalej → Max wierzchołek →
              </button>
            </>
          )}

          {/* ── FAZA 3: Max wierzchołek ── */}
          {phase === 'maxcorner' && extended && (
            <>
              <div className="desc">
                Metoda maksymalnego wierzchołka macierzy zysku.
                W każdej iteracji wybieramy komórkę o <strong>najwyższym z</strong>, przydzielamy maks. ilość.
              </div>
              {maxSteps.map(step => (
                <MaxCornerStepView key={step.step} step={step} table={extended} />
              ))}
              <button className="btnPrimary mt4" onClick={() => setPhase('modi')}>
                Dalej → MODI →
              </button>
            </>
          )}

          {/* ── FAZA 4: MODI ── */}
          {phase === 'modi' && extended && (
            <>
              <div className="desc">
                Metoda MODI: <strong>z<sub>ij</sub> = u<sub>i</sub> + v<sub>j</sub></strong> dla bazowych,{' '}
                <strong>D<sub>ij</sub> = z<sub>ij</sub> − u<sub>i</sub> − v<sub>j</sub></strong> dla niebazowych.
                Jeśli D<sub>ij</sub> &gt; 0 → nie optymalnie, wybieramy pętlę zmian.
              </div>
              {modiIters.map((iter, idx) => (
                <ModiIterationView key={idx} iter={iter} table={extended} iterIndex={idx + 1} />
              ))}
              {finalModi?.isOptimal && (
                <div className="result">
                  <div className="resultTitle">✓ Rozwiązanie optymalne</div>
                  <div className="resultSub">Maksymalny zysk całkowity:</div>
                  <div className="resultVal">{finalModi.totalProfit.toFixed(0)}</div>
                  <div className="resultSub mt12">Plan dostaw (bez FD/FO):</div>
                  {finalModi.alloc.flatMap((row, i) =>
                    row.map((x, j) => {
                      if (x <= 0) return null;
                      if (extended.isFDRow[i] || extended.isFOCol[j]) return null;
                      return (
                        <div key={`${i}-${j}`} className="allocRow">
                          <div>D{i + 1} → O{j + 1}</div>
                          <div>{x} jedn. × z={extended.profit[i][j]} = {x * extended.profit[i][j]}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              <button className="btnSec mt12" onClick={() => setPhase('input')}>
                ← Wróć do danych
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



export default App;
