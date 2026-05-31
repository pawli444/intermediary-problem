// ── Dane wejściowe ────────────────────────────────────────────────
export interface InputData {
  nD: number;
  nO: number;
  supply: number[];
  demand: number[];
  purchaseCost: number[];
  salePrice: number[];
  transport: number[][];
  blockedRoutes: Set<string>;      // "i,j" – konkretna trasa zablokowana (z = -M)
  prioritySuppliers: Set<number>;  // indeks dostawcy – jego trasy rozpatrywane pierwsze
  priorityReceivers: Set<number>;  // indeks odbiorcy  – jego kolumna rozpatrywana pierwsza
}

// ── Rozszerzona tablica (z FD i FO) ──────────────────────────────
export interface ExtendedTable {
  nRows: number;
  nCols: number;
  profit: number[][];
  supply: number[];
  demand: number[];
  isBlockedCell: boolean[][];
  isFDRow: boolean[];
  isFOCol: boolean[];
}

// ── Jeden snapshot iteracji metody max wierzchołka ────────────────
export interface MaxCornerStep {
  step: number;
  selI: number;
  selJ: number;
  selProfit: number;
  amount: number;
  alloc: number[][];
  remSupply: number[];
  remDemand: number[];
  activeRows: Set<number>;
  activeCols: Set<number>;
  removedRow: number | null;
  removedCol: number | null;
  phase: 'priority' | 'normal'; // czy krok był w fazie priorytetowej
}

// ── Jedna iteracja MODI ───────────────────────────────────────────
export interface ModiIteration {
  step: number;
  u: (number | null)[];
  v: (number | null)[];
  D: (number | null)[][];
  alloc: number[][];
  basis: boolean[][];
  enterI: number | null;
  enterJ: number | null;
  loop: [number, number][] | null;
  loopDelta: number | null;
  isOptimal: boolean;
  totalProfit: number;
}

export type CellKey = `${number},${number}`;