import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getDemoStore, initDemoStore, saveDemoStore, clearDemoStore, type DemoStore } from "./demo-data";

interface DemoContextType {
  isDemo: boolean;
  store: DemoStore | null;
  startDemo: () => void;
  endDemo: () => void;
  updateStore: (fn: (s: DemoStore) => DemoStore) => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false, store: null,
  startDemo: () => {}, endDemo: () => {}, updateStore: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);

  useEffect(() => {
    const s = getDemoStore();
    setStore(s);
  }, []);

  const startDemo = () => {
    const s = initDemoStore();
    setStore(s);
  };

  const endDemo = () => {
    clearDemoStore();
    setStore(null);
  };

  const updateStore = (fn: (s: DemoStore) => DemoStore) => {
    setStore((prev) => {
      const next = fn(prev!);
      saveDemoStore(next);
      return next;
    });
  };

  return (
    <DemoContext.Provider value={{ isDemo: !!store, store, startDemo, endDemo, updateStore }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
