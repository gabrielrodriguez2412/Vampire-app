import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Globe, Library, Trash2, Download, Upload } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { EDITIONS } from "@/data/editions";
import { LANGUAGES } from "@/data/languages";
import { LangCode, EditionId } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { activeLanguage, activeEdition, setLanguage, setEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const { toast } = useToast();

  const clearFavorites = () => {
    if(confirm(strings.confirmClearFavorites)) {
      localStorage.removeItem('vtm-favorites');
      window.dispatchEvent(new Event('storage'));
      toast({ title: strings.favoritesCleared });
    }
  };

  const exportData = () => {
    toast({ title: strings.comingSoon, description: strings.placeholder_feature });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div className="mb-8 flex items-center gap-3">
        <Settings2 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{strings.settingsTitle}</h1>
          <p className="text-muted-foreground">{strings.settingsSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2"><Globe className="w-5 h-5"/> {strings.language}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {LANGUAGES.map(lang => (
              <button 
                key={lang.code}
                onClick={() => setLanguage(lang.code as LangCode)}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                  activeLanguage === lang.code 
                    ? "bg-primary/20 border-primary text-foreground font-medium" 
                    : "bg-background border-border text-muted-foreground hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {activeLanguage === lang.code && <div className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2"><Library className="w-5 h-5"/> {strings.edition}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EDITIONS.map(ed => (
              <button 
                key={ed.id}
                onClick={() => setEdition(ed.id as EditionId)}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                  activeEdition === ed.id 
                    ? "bg-primary/20 border-primary text-foreground font-medium" 
                    : "bg-background border-border text-muted-foreground hover:bg-white/5"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span>{ed.shortName}</span>
                  <span className="text-xs opacity-70 font-normal">{ed.name}</span>
                </div>
                {activeEdition === ed.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Datos Locales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col md:flex-row gap-4">
          <Button variant="destructive" onClick={clearFavorites} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" /> Borrar Favoritos
          </Button>
          <Button variant="outline" onClick={exportData} className="flex-1 bg-background">
            <Download className="w-4 h-4 mr-2" /> Exportar Datos
          </Button>
          <Button variant="outline" onClick={exportData} className="flex-1 bg-background">
            <Upload className="w-4 h-4 mr-2" /> Importar Datos
          </Button>
        </CardContent>
      </Card>

      <div className="text-center py-8 text-muted-foreground text-sm space-y-2 border-t border-border">
        <p className="font-serif font-bold text-lg text-foreground">Vampiro La Mascarada Companion</p>
        <p>Versión 1.0.0</p>
        <p className="max-w-md mx-auto italic opacity-70">
          Esta es una herramienta de acompañamiento para fans. Todos los derechos de Vampiro: La Mascarada pertenecen a Paradox Interactive / World of Darkness.
        </p>
      </div>
    </div>
  );
}
