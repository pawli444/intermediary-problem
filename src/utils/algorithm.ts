import type { TransportInput, IterationSnapshot, AlgorithmResult, CellKey } from '../types/transport';

export function cellKey(i: number, j: number): CellKey {
  return `${i},${j}`;
}

export function runMaxCornerMethod(input: TransportInput): AlgorithmResult {
  const { costs, blocked } = input;
  const nD = costs.length;
  const nO = costs[0].length;

  const S = [...input.supply];
  const D = [...input.demand];
  const alloc: number[][] = Array.from({ length: nD }, () => Array(nO).fill(0));
  const iterations: IterationSnapshot[] = [];

  const activeRows = new Set<number>(Array.from({ length: nD }, (_, i) => i));
  const activeCols = new Set<number>(Array.from({ length: nO }, (_, j) => j));

  const hasUnblocked = (): boolean => {
    for (const i of activeRows)
      for (const j of activeCols)
        if (!blocked.has(cellKey(i, j))) return true;
    return false;
  };

  while (activeRows.size > 0 && activeCols.size > 0 && hasUnblocked()) {
    let maxCost = -Infinity;
    let maxI = -1;
    let maxJ = -1;

    for (const i of activeRows) {
      for (const j of activeCols) {
        if (blocked.has(cellKey(i, j))) continue;
        if (costs[i][j] > maxCost) {
          maxCost = costs[i][j];
          maxI = i;
          maxJ = j;
        }
      }
    }

    if (maxI === -1) break;

    const amount = Math.min(S[maxI], D[maxJ]);
    alloc[maxI][maxJ] += amount;
    S[maxI] -= amount;
    D[maxJ] -= amount;

    const snap: IterationSnapshot = {
      step: iterations.length + 1,
      maxI,
      maxJ,
      maxCost,
      amount,
      remainingSupply: [...S],
      remainingDemand: [...D],
      alloc: alloc.map((r) => [...r]),
      activeRows: new Set(activeRows),
      activeCols: new Set(activeCols),
      removedRow: null,
      removedCol: null,
    };

    if (S[maxI] <= 0.001) {
      snap.removedRow = maxI;
      activeRows.delete(maxI);
    }
    if (D[maxJ] <= 0.001) {
      snap.removedCol = maxJ;
      activeCols.delete(maxJ);
    }

    iterations.push(snap);
  }

  const lastAlloc = iterations.length > 0 ? iterations[iterations.length - 1].alloc : alloc;
  let totalCost = 0;
  const allocations: AlgorithmResult['allocations'] = [];

  for (let i = 0; i < nD; i++) {
    for (let j = 0; j < nO; j++) {
      if (lastAlloc[i][j] > 0) {
        const cost = costs[i][j];
        const amt = lastAlloc[i][j];
        totalCost += amt * cost;
        allocations.push({ i, j, amount: amt, cost });
      }
    }
  }

  return { iterations, totalCost, allocations };
}

export const EXAMPLE_PRESET = {
  nD: 3,
  nO: 4,
  costs: [
    [2, 3, 1, 5],
    [7, 3, 4, 6],
    [5, 5, 2, 3],
  ],
  supply: [30, 40, 20],
  demand: [20, 30, 25, 15],
};
