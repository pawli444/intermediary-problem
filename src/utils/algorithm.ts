import type {
  InputData, ExtendedTable, MaxCornerStep, ModiIteration,
} from '../types';

export const BIG_M = 9999;

export const EXAMPLE: InputData = {
  nD: 2, nO: 3,
  supply: [20, 30],
  demand: [10, 28, 27],
  purchaseCost: [10, 12],
  salePrice: [30, 25, 30],
  transport: [[8, 14, 17], [12, 9, 19]],
  blockedRoutes: new Set(),
  prioritySuppliers: new Set(),
  priorityReceivers: new Set(),
};

export function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

export function buildExtended(inp: InputData): ExtendedTable {
  const { nD, nO, supply, demand, purchaseCost, salePrice, transport, blockedRoutes } = inp;
  const nRows = nD + 1;
  const nCols = nO + 1;

  const totalSupply = supply.reduce((a, b) => a + b, 0);
  const totalDemand = demand.reduce((a, b) => a + b, 0);

  const extSupply = [...supply, totalDemand];
  const extDemand = [...demand, totalSupply];

  const profit: number[][] = [];
  const isBlockedCell: boolean[][] = [];
  const isFDRow = Array(nRows).fill(false);
  const isFOCol = Array(nCols).fill(false);
  isFDRow[nD] = true;
  isFOCol[nO] = true;

  for (let i = 0; i < nRows; i++) {
    profit.push([]);
    isBlockedCell.push([]);
    for (let j = 0; j < nCols; j++) {
      const isFD = i === nD;
      const isFO = j === nO;
      if (isFD || isFO) {
        profit[i].push(0);
        isBlockedCell[i].push(false);
      } else if (blockedRoutes.has(cellKey(i, j))) {
        profit[i].push(-BIG_M);
        isBlockedCell[i].push(true);
      } else {
        const z = salePrice[j] - purchaseCost[i] - transport[i][j];
        profit[i].push(z);
        isBlockedCell[i].push(false);
      }
    }
  }

  return { nRows, nCols, profit, supply: extSupply, demand: extDemand, isBlockedCell, isFDRow, isFOCol };
}

function pickBest(
  rows: Set<number>, cols: Set<number>, profit: number[][], isBlockedCell: boolean[][]
): { i: number; j: number; val: number } | null {
  let maxP = -Infinity, selI = -1, selJ = -1;
  for (const i of rows) {
    for (const j of cols) {
      if (isBlockedCell[i]?.[j]) continue;
      if (profit[i][j] > maxP) { maxP = profit[i][j]; selI = i; selJ = j; }
    }
  }
  if (selI === -1) return null;
  return { i: selI, j: selJ, val: maxP };
}

export function runMaxCorner(
  table: ExtendedTable,
  prioritySuppliers: Set<number>,
  priorityReceivers: Set<number>,
): MaxCornerStep[] {
  const { nRows, nCols, profit, isBlockedCell } = table;
  const S = [...table.supply];
  const D = [...table.demand];
  const alloc: number[][] = Array.from({ length: nRows }, () => Array(nCols).fill(0));
  const activeRows = new Set<number>(Array.from({ length: nRows }, (_, i) => i));
  const activeCols = new Set<number>(Array.from({ length: nCols }, (_, j) => j));
  const steps: MaxCornerStep[] = [];

  while (activeRows.size > 0 && activeCols.size > 0) {
    const prioRows = new Set([...activeRows].filter(i => prioritySuppliers.has(i)));
    const prioCols = new Set([...activeCols].filter(j => priorityReceivers.has(j)));

    let selI = -1, selJ = -1, maxP = -Infinity;
    let phase: 'priority' | 'normal' = 'normal';

    if (prioRows.size > 0 || prioCols.size > 0) {
      let bestI = -1;
      let bestJ = -1;
      let bestVal = -Infinity;
      if (prioRows.size > 0) {
        const cand = pickBest(prioRows, activeCols, profit, isBlockedCell);
        if (cand && cand.val > bestVal) { bestI = cand.i; bestJ = cand.j; bestVal = cand.val; }
      }
      if (prioCols.size > 0) {
        const cand = pickBest(activeRows, prioCols, profit, isBlockedCell);
        if (cand && cand.val > bestVal) { bestI = cand.i; bestJ = cand.j; bestVal = cand.val; }
      }
      if (bestI !== -1) { selI = bestI; selJ = bestJ; maxP = bestVal; phase = 'priority'; }
    }

    if (selI === -1) {
      // Zasada: FO i FD obsadzamy na końcu — najpierw szukaj wśród
      // rzeczywistych wierszy × rzeczywistych kolumn,
      // potem rzeczywiste wiersze × FO,
      // potem FD × rzeczywiste kolumny,
      // na końcu FD × FO
      const realRows = new Set([...activeRows].filter(i => !table.isFDRow[i]));
      const realCols = new Set([...activeCols].filter(j => !table.isFOCol[j]));
      const fdRows  = new Set([...activeRows].filter(i =>  table.isFDRow[i]));
      const foCols  = new Set([...activeCols].filter(j =>  table.isFOCol[j]));

      let cand =
        (realRows.size > 0 && realCols.size > 0 ? pickBest(realRows, realCols, profit, isBlockedCell) : null) ??
        (realRows.size > 0 && foCols.size  > 0 ? pickBest(realRows, foCols,  profit, isBlockedCell) : null) ??
        (fdRows.size  > 0 && realCols.size > 0 ? pickBest(fdRows,  realCols, profit, isBlockedCell) : null) ??
        pickBest(activeRows, activeCols, profit, isBlockedCell);

      if (!cand) break;
      selI = cand.i; selJ = cand.j; maxP = cand.val;
      phase = 'normal';
    }

    const amount = Math.min(S[selI], D[selJ]);
    alloc[selI][selJ] += amount;
    S[selI] -= amount;
    D[selJ] -= amount;

    const snap: MaxCornerStep = {
      step: steps.length + 1,
      selI, selJ, selProfit: maxP, amount,
      alloc: alloc.map(r => [...r]),
      remSupply: [...S],
      remDemand: [...D],
      activeRows: new Set(activeRows),
      activeCols: new Set(activeCols),
      removedRow: null,
      removedCol: null,
      phase,
    };
    if (S[selI] <= 0.001) { snap.removedRow = selI; activeRows.delete(selI); }
    if (D[selJ] <= 0.001) { snap.removedCol = selJ; activeCols.delete(selJ); }
    steps.push(snap);
  }
  return steps;
}

function computeUV(
  basis: boolean[][], profit: number[][], nRows: number, nCols: number
): { u: (number | null)[]; v: (number | null)[] } {
  const u: (number | null)[] = Array(nRows).fill(null);
  const v: (number | null)[] = Array(nCols).fill(null);
  u[0] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < nRows; i++) {
      for (let j = 0; j < nCols; j++) {
        if (!basis[i][j]) continue;
        if (u[i] !== null && v[j] === null) { v[j] = profit[i][j] - u[i]!; changed = true; }
        if (v[j] !== null && u[i] === null) { u[i] = profit[i][j] - v[j]!; changed = true; }
      }
    }
  }
  return { u, v };
}

function findLoop(
  enterI: number, enterJ: number,
  basis: boolean[][], nRows: number, nCols: number
): [number, number][] | null {
  type Cell = [number, number];

  function dfs(
    path: Cell[],
    usedRows: Set<number>,
    usedCols: Set<number>,
    horizontal: boolean
  ): Cell[] | null {
    const [ci, cj] = path[path.length - 1];

    if (horizontal) {
      for (let j = 0; j < nCols; j++) {
        if (j === cj) continue;
        if (ci === enterI && j === enterJ && path.length >= 3) return [...path, [ci, j]];
        if (!usedCols.has(j) && basis[ci][j]) {
          const np = dfs([...path, [ci, j]], usedRows, new Set([...usedCols, j]), false);
          if (np) return np;
        }
      }
    } else {
      for (let i = 0; i < nRows; i++) {
        if (i === ci) continue;
        if (i === enterI && cj === enterJ && path.length >= 3) return [...path, [i, cj]];
        if (!usedRows.has(i) && basis[i][cj]) {
          const np = dfs([...path, [i, cj]], new Set([...usedRows, i]), usedCols, true);
          if (np) return np;
        }
      }
    }
    return null;
  }

  return dfs([[enterI, enterJ]], new Set<number>(), new Set<number>(), true);
}

export function modiStep(
  alloc: number[][], profit: number[][], isBlockedCell: boolean[][], nRows: number, nCols: number
): ModiIteration {
  const basis: boolean[][] = Array.from({ length: nRows }, (_, i) =>
    Array.from({ length: nCols }, (_, j) => alloc[i][j] > 0 && !isBlockedCell[i][j])
  );

  const { u, v } = computeUV(basis, profit, nRows, nCols);

  const D: (number | null)[][] = Array.from({ length: nRows }, () => Array(nCols).fill(null));
  let maxD = -Infinity, enterI: number | null = null, enterJ: number | null = null;

  for (let i = 0; i < nRows; i++) {
    for (let j = 0; j < nCols; j++) {
      if (basis[i][j]) continue;
      if (isBlockedCell[i][j]) continue;
      if (u[i] === null || v[j] === null) continue;
      const d = profit[i][j] - u[i]! - v[j]!;
      D[i][j] = d;
      if (d > maxD) { maxD = d; enterI = i; enterJ = j; }
    }
  }

  const totalProfit = alloc.flat().reduce((s, x, k) => {
    const i = Math.floor(k / nCols), j = k % nCols;
    if (isBlockedCell[i][j]) return s;
    return s + x * profit[i][j];
  }, 0);

  if (maxD <= 0.0001 || enterI === null || enterJ === null) {
    return {
      step: 0, u, v, D,
      alloc: alloc.map(r => [...r]),
      basis, enterI: null, enterJ: null,
      loop: null, loopDelta: null,
      isOptimal: true, totalProfit,
    };
  }

  const loopRaw = findLoop(enterI, enterJ, basis, nRows, nCols);

  if (!loopRaw) {
    const newAlloc = alloc.map(r => [...r]);
    newAlloc[enterI][enterJ] = 0.0001;
    return {
      step: 0, u, v, D,
      alloc: newAlloc,
      basis, enterI, enterJ,
      loop: null, loopDelta: null,
      isOptimal: false, totalProfit,
    };
  }

  // Usuń ostatni element (duplikat komórki wchodzącej - zamknięcie pętli)
  const loop = loopRaw.slice(0, -1) as [number, number][];

  const minusPositions = loop.filter((_, k) => k % 2 === 1);
  const delta = Math.min(...minusPositions.map(([i, j]) => alloc[i][j]));

  const newAlloc = alloc.map(r => [...r]);
  loop.forEach(([i, j], k) => {
    if (k % 2 === 0) newAlloc[i][j] += delta;
    else newAlloc[i][j] -= delta;
  });

  return {
    step: 0, u, v, D,
    alloc: newAlloc,
    basis, enterI, enterJ,
    loop, loopDelta: delta,
    isOptimal: false, totalProfit,
  };
}

export function runModi(
  initialAlloc: number[][], profit: number[][], isBlockedCell: boolean[][], nRows: number, nCols: number,
  maxIter = 50
): ModiIteration[] {
  const iters: ModiIteration[] = [];
  let alloc = initialAlloc.map(r => [...r]);
  for (let i = 0; i < maxIter; i++) {
    const it = modiStep(alloc, profit, isBlockedCell, nRows, nCols);
    it.step = i + 1;
    iters.push(it);
    if (it.isOptimal) break;
    alloc = it.alloc;
  }
  return iters;
}