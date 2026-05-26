import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  id: string;            // menu_item.id
  name: string;          // знімок назви на момент додавання (мовою користувача)
  price: number;         // знімок ціни на момент додавання (з урахуванням special / discount)
  currency: string;
  imageUrl: string | null;
  qty: number;
}

interface CartState {
  // Окремий tenant_id у persist-ключі — щоб 2 ресторани в одному browser
  // не змішували кошики. Перевіряємо при кожній операції.
  tenantId: string | null;
  lines: Record<string, CartLine>;

  setTenant: (tenantId: string) => void;
  add: (line: Omit<CartLine, 'qty'>) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      lines: {},

      setTenant: (tenantId) => {
        const current = get().tenantId;
        if (current && current !== tenantId) {
          // Перехід на інший заклад — скидаємо чужий кошик.
          set({ tenantId, lines: {} });
        } else {
          set({ tenantId });
        }
      },

      add: (line) =>
        set((state) => {
          const existing = state.lines[line.id];
          return {
            lines: {
              ...state.lines,
              [line.id]: existing
                ? { ...existing, qty: existing.qty + 1 }
                : { ...line, qty: 1 },
            },
          };
        }),

      increment: (id) =>
        set((state) => {
          const line = state.lines[id];
          if (!line) return state;
          return { lines: { ...state.lines, [id]: { ...line, qty: line.qty + 1 } } };
        }),

      decrement: (id) =>
        set((state) => {
          const line = state.lines[id];
          if (!line) return state;
          if (line.qty <= 1) {
            const { [id]: _, ...rest } = state.lines;
            return { lines: rest };
          }
          return { lines: { ...state.lines, [id]: { ...line, qty: line.qty - 1 } } };
        }),

      remove: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.lines;
          return { lines: rest };
        }),

      clear: () => set({ lines: {} }),
    }),
    {
      name: 'botilocal_cart',
      partialize: (state) => ({ tenantId: state.tenantId, lines: state.lines }),
    },
  ),
);

// Селектори-помічники — щоб компоненти ре-рендерились тільки на потрібну зміну.
export const selectCartCount = (s: CartState): number =>
  Object.values(s.lines).reduce((sum, l) => sum + l.qty, 0);

export const selectCartTotal = (s: CartState): number =>
  Object.values(s.lines).reduce((sum, l) => sum + l.qty * l.price, 0);

export const selectCartLines = (s: CartState): CartLine[] => Object.values(s.lines);
