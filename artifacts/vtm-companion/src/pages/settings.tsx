import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Globe, Library, Trash2, Download, Upload, Info, Sliders, Database, ShieldAlert, HardDrive } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { EDITION_LIST } from "@/data/editions";
import { LANGUAGES } from "@/data/languages";
import { LangCode, EditionId } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAppBackupActions } from "@/hooks/useAppBackupActions";

export default function SettingsPage() {
  const { activeLanguage, activeEdition, setLanguage, setEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const { toast } = useToast();
  const backup = useAppBackupActions();

  const clearFavorites = () => {
    if (confirm(strings.confirmClearFavorites)) {
      localStorage.removeItem('vtm-favorites');
      window.dispatchEvent(new Event('storage'));
      toast({ title: strings.favoritesCleared });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Hidden file input shared by the Import button. */}
      <input
        type="file"
        accept="application/json"
        ref={backup.fileInputRef}
        onChange={backup.handleImportFile}
        className="hidden"
      />

      <div className="mb-2 sm:mb-8 flex items-center gap-3">
        <Settings2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">{strings.settingsTitle}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{strings.settingsSubtitle}</p>
        </div>
      </div>

      {/* ─────────── App Preferences ─────────── */}
      <SectionHeader
        icon={<Sliders className="w-5 h-5 text-primary" />}
        title={strings.settings_app_preferences || 'App Preferences'}
        description={strings.settings_app_preferences_desc}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" /> {strings.language}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {LANGUAGES.map(lang => {
              const active = activeLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as LangCode)}
                  aria-pressed={active}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-md border transition-colors ${
                    active
                      ? "bg-primary/20 border-primary text-foreground font-medium"
                      : "bg-background border-border text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {active && <div className="w-2 h-2 rounded-full bg-primary" aria-hidden />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Library className="w-5 h-5" /> {strings.edition}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EDITION_LIST.map(ed => {
              const active = activeEdition === ed.id;
              return (
                <button
                  key={ed.id}
                  onClick={() => setEdition(ed.id as EditionId)}
                  aria-pressed={active}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-md border transition-colors ${
                    active
                      ? "bg-primary/20 border-primary text-foreground font-medium"
                      : "bg-background border-border text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{ed.shortName}</span>
                    <span className="text-xs opacity-70 font-normal">{ed.name}</span>
                  </div>
                  {active && <div className="w-2 h-2 rounded-full bg-primary" aria-hidden />}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ─────────── Data Management ─────────── */}
      <SectionHeader
        icon={<Database className="w-5 h-5 text-primary" />}
        title={strings.settings_data_management || 'Local Data'}
        description={strings.settings_data_management_desc}
      />

      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <DataActionRow
            icon={<Download className="w-4 h-4" />}
            label={strings.full_backup_export || 'Export Full Backup'}
            description={strings.settings_export_desc || strings.full_backup_includes}
            onClick={backup.handleExportAll}
            variant="primary"
          />
          <DataActionRow
            icon={<Upload className="w-4 h-4" />}
            label={strings.full_backup_import || 'Import Full Backup'}
            description={strings.settings_import_desc}
            onClick={backup.handleImportClick}
            variant="outline"
          />
          <DataActionRow
            icon={<Trash2 className="w-4 h-4" />}
            label={strings.clearFavoritesBtn || 'Clear Favorites'}
            description={strings.settings_clear_favs_desc}
            onClick={clearFavorites}
            variant="destructive"
          />
        </CardContent>
      </Card>

      {/* ─────────── Data & Legal ─────────── */}
      <SectionHeader
        icon={<ShieldAlert className="w-5 h-5 text-primary" />}
        title={strings.settings_legal_section || 'Data & Legal'}
        description={strings.settings_legal_section_desc}
      />

      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6 space-y-3 text-sm text-foreground/85">
          <div className="flex items-start gap-3">
            <HardDrive className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden />
            <p>
              {strings.settings_legal_data_notice
                || 'Data is stored locally on this device. Export backups regularly to avoid losing characters, chronicles, notes, and settings.'}
            </p>
          </div>
          <div className="flex items-start gap-3 italic text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" aria-hidden />
            <p>
              {strings.settings_legal_disclaimer_short
                || 'VTM Companion is an unofficial fan-made tool and is not affiliated with, endorsed by, or sponsored by the rights holders.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─────────── About ─────────── */}
      <SectionHeader
        icon={<Info className="w-5 h-5 text-primary" />}
        title={strings.settings_about || 'About'}
      />

      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6 text-sm text-muted-foreground space-y-2">
          <p className="font-serif font-bold text-base text-foreground">
            {strings.settings_about_app || 'Vampire: The Masquerade — Companion'}
          </p>
          <p className="italic opacity-80">
            {strings.settings_about_disclaimer}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="pt-2 sm:pt-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-serif text-lg sm:text-xl text-foreground">{title}</h2>
      </div>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-7 max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}

interface DataActionRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant: "primary" | "outline" | "destructive";
}

function DataActionRow({ icon, label, description, onClick, variant }: DataActionRowProps) {
  const btnClass =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : variant === "destructive"
        ? ""
        : "bg-background";
  const btnVariant = variant === "primary" ? "default" : variant === "destructive" ? "destructive" : "outline";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b last:border-b-0 border-border/60 last:pb-0 pb-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">{description}</p>
        )}
      </div>
      <Button onClick={onClick} variant={btnVariant} className={`gap-2 shrink-0 sm:w-auto w-full ${btnClass}`}>
        {icon}
        {label}
      </Button>
    </div>
  );
}
