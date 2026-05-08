import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LangCode, EditionId } from '../types';

interface AppContextType {
  activeLanguage: LangCode;
  activeEdition: EditionId;
  setLanguage: (lang: LangCode) => void;
  setEdition: (edition: EditionId) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [activeLanguage, setActiveLanguage] = useState<LangCode>(() => {
    return (localStorage.getItem('vtm-language') as LangCode) || 'es';
  });

  const [activeEdition, setActiveEdition] = useState<EditionId>(() => {
    const saved = localStorage.getItem('vtm-edition');
    if (!saved) return 'V5';
    const normalized = saved.toUpperCase();
    if (normalized === 'V1' || normalized === '1ST') return '1ST';
    if (normalized === 'V2' || normalized === '2ND') return '2ND';
    if (normalized === 'REVISED') return 'REVISED';
    if (normalized === 'V20') return 'V20';
    if (normalized === 'V5') return 'V5';
    return 'V5';
  });

  useEffect(() => {
    localStorage.setItem('vtm-language', activeLanguage);
  }, [activeLanguage]);

  useEffect(() => {
    localStorage.setItem('vtm-edition', activeEdition);
  }, [activeEdition]);

  return (
    <AppContext.Provider value={{ activeLanguage, activeEdition, setLanguage: setActiveLanguage, setEdition: setActiveEdition }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
