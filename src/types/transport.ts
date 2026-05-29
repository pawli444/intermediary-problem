export interface TransportInput {
  costs: number[][];
  supply: number[];
  demand: number[];
  blocked: Set<string>;
}

export interface IterationSnapshot {
  step: number;
  maxI: number;
  maxJ: number;
  maxCost: number;
  amount: number;
  remainingSupply: number[];
  remainingDemand: number[];
  alloc: number[][];
  activeRows: Set<number>;
  activeCols: Set<number>;
  removedRow: number | null;
  removedCol: number | null;
}

export interface AlgorithmResult {
  iterations: IterationSnapshot[];
  totalCost: number;
  allocations: { i: number; j: number; amount: number; cost: number }[];
}

export type CellKey = `${number},${number}`;
