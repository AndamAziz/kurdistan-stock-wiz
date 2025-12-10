import { createContext, useContext, useState, ReactNode } from "react";

interface VisitMarket {
  id: string;
  name: string;
  code: string;
}

interface MandwbTabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isVisitMode: boolean;
  visitMarket: VisitMarket | null;
  startVisit: (market: VisitMarket) => void;
  endVisit: () => void;
}

const MandwbTabContext = createContext<MandwbTabContextType | null>(null);

export function MandwbTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isVisitMode, setIsVisitMode] = useState(false);
  const [visitMarket, setVisitMarket] = useState<VisitMarket | null>(null);

  const startVisit = (market: VisitMarket) => {
    setVisitMarket(market);
    setIsVisitMode(true);
  };

  const endVisit = () => {
    setVisitMarket(null);
    setIsVisitMode(false);
  };

  return (
    <MandwbTabContext.Provider value={{ 
      activeTab, 
      setActiveTab, 
      isVisitMode, 
      visitMarket, 
      startVisit, 
      endVisit 
    }}>
      {children}
    </MandwbTabContext.Provider>
  );
}

export function useMandwbTab() {
  const context = useContext(MandwbTabContext);
  if (!context) {
    return { 
      activeTab: "dashboard", 
      setActiveTab: () => {}, 
      isVisitMode: false, 
      visitMarket: null, 
      startVisit: () => {}, 
      endVisit: () => {} 
    };
  }
  return context;
}
