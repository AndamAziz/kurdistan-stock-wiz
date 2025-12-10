import { createContext, useContext, useState, ReactNode } from "react";

interface MandwbTabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MandwbTabContext = createContext<MandwbTabContextType | null>(null);

export function MandwbTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <MandwbTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </MandwbTabContext.Provider>
  );
}

export function useMandwbTab() {
  const context = useContext(MandwbTabContext);
  if (!context) {
    // Return default values when used outside provider
    return { activeTab: "dashboard", setActiveTab: () => {} };
  }
  return context;
}
