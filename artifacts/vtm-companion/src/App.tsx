import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Clans from "@/pages/clans";
import Disciplines from "@/pages/disciplines";
import Rules from "@/pages/rules";
import Roleplay from "@/pages/roleplay";
import Tools from "@/pages/tools";
import Favorites from "@/pages/favorites";
import Glossary from "@/pages/glossary";
import Notes from "@/pages/notes";
import Compendium from "@/pages/compendium";
import Character from "@/pages/character";
import Chronicle from "@/pages/chronicle";
import Settings from "@/pages/settings";
import Search from "@/pages/search";

import { AppContextProvider } from "@/context/AppContext";
import { validateData } from "@/utils/validation";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        
        {/* Compendium Routes */}
        <Route path="/compendium" component={Compendium} />
        <Route path="/compendium/clanes" component={Clans} />
        <Route path="/compendium/clanes/:id" component={Clans} />
        <Route path="/compendium/disciplinas" component={Disciplines} />
        <Route path="/compendium/disciplinas/:id" component={Disciplines} />
        <Route path="/compendium/reglas" component={Rules} />
        <Route path="/compendium/roleplay" component={Roleplay} />
        <Route path="/compendium/herramientas" component={Tools} />
        <Route path="/compendium/glosario" component={Glossary} />
        
        {/* Legacy routes for backwards compatibility / internal links */}
        <Route path="/clanes" component={Clans} />
        <Route path="/clanes/:id" component={Clans} />
        <Route path="/disciplinas" component={Disciplines} />
        <Route path="/disciplinas/:id" component={Disciplines} />
        <Route path="/reglas" component={Rules} />
        <Route path="/roleplay" component={Roleplay} />
        <Route path="/herramientas" component={Tools} />
        <Route path="/glosario" component={Glossary} />

        {/* New main sections */}
        <Route path="/personaje" component={Character} />
        <Route path="/cronica" component={Chronicle} />
        <Route path="/ajustes" component={Settings} />
        <Route path="/buscar" component={Search} />
        
        {/* Utilities */}
        <Route path="/favoritos" component={Favorites} />
        <Route path="/notas" component={Notes} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const warnings = validateData();
      if (warnings.length > 0) {
        console.warn("Data Validation Warnings:", warnings);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContextProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AppContextProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
