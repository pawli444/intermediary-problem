import React from 'react';
import type { InputData } from '../types';
import { cellKey } from '../utils/algorithm';
import './InputPanel.css';

interface Props {
  data: InputData;
  onChange: (d: InputData) => void;
}

const InputPanel: React.FC<Props> = ({ data, onChange }) => {
  const {
    nD, nO, supply, demand, purchaseCost, salePrice,
    transport, blockedRoutes, prioritySuppliers, priorityReceivers,
  } = data;

  const set = (patch: Partial<InputData>) => onChange({ ...data, ...patch });

  const setND = (v: number) => {
    const n = Math.max(1, Math.min(10, v));
    set({
      nD: n,
      supply: Array.from({ length: n }, (_, i) => supply[i] ?? 0),
      purchaseCost: Array.from({ length: n }, (_, i) => purchaseCost[i] ?? 0),
      transport: Array.from({ length: n }, (_, i) =>
        Array.from({ length: nO }, (_, j) => transport[i]?.[j] ?? 0)
      ),
      blockedRoutes: new Set(),
      prioritySuppliers: new Set(),
    });
  };

  const setNO = (v: number) => {
    const n = Math.max(1, Math.min(10, v));
    set({
      nO: n,
      demand: Array.from({ length: n }, (_, j) => demand[j] ?? 0),
      salePrice: Array.from({ length: n }, (_, j) => salePrice[j] ?? 0),
      transport: Array.from({ length: nD }, (_, i) =>
        Array.from({ length: n }, (_, j) => transport[i]?.[j] ?? 0)
      ),
      blockedRoutes: new Set(),
      priorityReceivers: new Set(),
    });
  };

  const updArr = <T,>(arr: T[], i: number, v: T): T[] =>
    arr.map((x, k) => k === i ? v : x);
  const updMat = (mat: number[][], i: number, j: number, v: number) =>
    mat.map((row, r) => r === i ? row.map((c, col) => col === j ? v : c) : row);

  // Toggle zablokowanej trasy (klik na komórkę kosztu)
  const toggleRoute = (i: number, j: number) => {
    const k = cellKey(i, j);
    const nb = new Set(blockedRoutes);
    if (nb.has(k)) nb.delete(k); else nb.add(k);
    set({ blockedRoutes: nb });
  };

  // Toggle priorytetu dostawcy (klik na nagłówek wiersza)
  const toggleSupplierPriority = (i: number) => {
    const ns = new Set(prioritySuppliers);
    if (ns.has(i)) ns.delete(i); else ns.add(i);
    set({ prioritySuppliers: ns });
  };

  // Toggle priorytetu odbiorcy (klik na nagłówek kolumny w tabeli transportu)
  const toggleReceiverPriority = (j: number) => {
    const nr = new Set(priorityReceivers);
    if (nr.has(j)) nr.delete(j); else nr.add(j);
    set({ priorityReceivers: nr });
  };

  return (
    <div className="input-wrap">
      {/* Wymiary */}
      <div className="input-row">
        <span className="label">Dostawców (D)</span>
        <input type="number" className="dim" value={nD} min={1} max={10}
          onChange={e => setND(parseInt(e.target.value))} />
        <span className="label">Odbiorców (O)</span>
        <input type="number" className="dim" value={nO} min={1} max={10}
          onChange={e => setNO(parseInt(e.target.value))} />
      </div>

      {/* Dostawcy */}
      <div className="section-label">Dostawcy</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
        Kliknij nazwę dostawcy aby oznaczyć priorytet (jego trasy rozpatrywane pierwsze)
      </div>
      <table className="tbl">
        <thead>
            <tr>
              <th className="th"></th>
              <th className="th">Podaż</th>
              <th className="th">Koszt zakupu kz</th>
            </tr>
        </thead>
        <tbody>
          {Array.from({ length: nD }, (_, i) => {
            const isPrio = prioritySuppliers.has(i);
            return (
              <tr key={i}>
                <td
                  className="clickable-td"
                  style={{
                    cursor: 'pointer',
                    background: isPrio ? '#fefce8' : undefined,
                    fontWeight: 700,
                    color: isPrio ? '#b45309' : '#374151',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleSupplierPriority(i)}
                  title={isPrio ? 'Priorytetowy — kliknij aby usunąć' : 'Kliknij aby oznaczyć jako priorytetowy'}
                >
                  {isPrio ? '⭐' : ''} D{i + 1}
                </td>
                <td className="td">
                  <input type="number" className="inp" value={supply[i] ?? ''} min={0}
                    onChange={e => set({ supply: updArr(supply, i, parseFloat(e.target.value) || 0) })} />
                </td>
                <td className="td">
                  <input type="number" className="inp" value={purchaseCost[i] ?? ''} min={0}
                    onChange={e => set({ purchaseCost: updArr(purchaseCost, i, parseFloat(e.target.value) || 0) })} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Odbiorcy */}
      <div className="section-label">Odbiorcy</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
        Kliknij nazwę odbiorcy aby oznaczyć priorytet (jego kolumna rozpatrywana pierwsza)
      </div>
      <table className="tbl">
        <thead>
            <tr>
              <th className="th"></th>
              <th className="th">Popyt</th>
              <th className="th">Cena sprzedaży c</th>
            </tr>
        </thead>
        <tbody>
          {Array.from({ length: nO }, (_, j) => {
            const isPrio = priorityReceivers.has(j);
            return (
              <tr key={j}>
                <td
                  className="clickable-td"
                  style={{
                    cursor: 'pointer',
                    background: isPrio ? '#fefce8' : undefined,
                    fontWeight: 700,
                    color: isPrio ? '#b45309' : '#374151',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleReceiverPriority(j)}
                  title={isPrio ? 'Priorytetowy — kliknij aby usunąć' : 'Kliknij aby oznaczyć jako priorytetowy'}
                >
                  {isPrio ? '⭐' : ''} O{j + 1}
                </td>
                <td className="td">
                  <input type="number" className="inp" value={demand[j] ?? ''} min={0}
                    onChange={e => set({ demand: updArr(demand, j, parseFloat(e.target.value) || 0) })} />
                </td>
                <td className="td">
                  <input type="number" className="inp" value={salePrice[j] ?? ''} min={0}
                    onChange={e => set({ salePrice: updArr(salePrice, j, parseFloat(e.target.value) || 0) })} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Koszty transportu */}
      <div className="section-label">Koszty transportu kt</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
        PPM lub kliknij komórkę = zablokuj trasę (z = −M)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th className="th"></th>
              {Array.from({ length: nO }, (_, j) => (
                <th key={j} className="th" style={{
                  background: priorityReceivers.has(j) ? '#fefce8' : '#f9fafb',
                  color: priorityReceivers.has(j) ? '#b45309' : '#6b7280',
                }}>
                  {priorityReceivers.has(j) ? '⭐ ' : ''}O{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nD }, (_, i) => (
              <tr key={i}>
                <th className="th" style={{
                  background: prioritySuppliers.has(i) ? '#fefce8' : '#f9fafb',
                  color: prioritySuppliers.has(i) ? '#b45309' : '#6b7280',
                }}>
                  {prioritySuppliers.has(i) ? '⭐ ' : ''}D{i + 1}
                </th>
                {Array.from({ length: nO }, (_, j) => {
                  const isBlocked = blockedRoutes.has(cellKey(i, j));
                  return (
                    <td key={j}
                      className="td"
                      style={{
                        background: isBlocked ? '#fef2f2' : undefined,
                        cursor: 'pointer',
                      }}
                      onContextMenu={e => { e.preventDefault(); toggleRoute(i, j); }}
                      onClick={() => toggleRoute(i, j)}
                      title={isBlocked ? 'Zablokowana — kliknij aby odblokować' : 'Kliknij aby zablokować'}
                    >
                      {isBlocked
                        ? <span style={{ color: '#dc2626', fontWeight: 600 }}>🚫</span>
                        : <input
                            type="number"
                            className="inp"
                            value={transport[i]?.[j] ?? ''}
                            min={0}
                            onClick={e => e.stopPropagation()}
                            onChange={e => set({
                              transport: updMat(transport, i, j, parseFloat(e.target.value) || 0),
                            })}
                          />
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InputPanel;