import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Clans from "@/pages/clans";
import Disciplines from "@/pages/disciplines";
// Imports to be created next
import Rules from "@/pages/rules";
import Roleplay from "@/pages/roleplay";
import Tools from "@/pages/tools";
import Favorites from "@/pages/favorites";
import Glossary from "@/pages/glossary";
import Notes from "@/pages/notes";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/clanes" component={Clans} />
        <Route path="/disciplinas" component={Disciplines} />
        <Route path="/reglas" component={Rules} />
        <Route path="/roleplay" component={Roleplay} />
        <Route path="/herramientas" component={Tools} />
        <Route path="/favoritos" component={Favorites} />
        <Route path="/glosario" component={Glossary} />
        <Route path="/notas" component={Notes} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;