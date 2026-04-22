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
    return (localStorage.getItem('vtm-edition') as EditionId) || 'v5';
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
