import { useRef } from "react";
import { useToast } from "./use-toast";
import { UI_STRINGS } from "@/i18n/ui";
import { useAppContext } from "@/context/AppContext";
import {
  downloadAppBackup,
  importAppBackup,
  isAppBackupV2,
} from "@/services/appBackup";
import {
  getCharacters,
  importCharacterBackup,
} from "@/services/characterStorage";

interface Options {
  /**
   * Called after a successful import so the page can refresh its local
   * lists (characters, chronicles, sessions, etc.). The hook itself
   * doesn't know which arrays the page caches.
   */
  onAfterImport?: () => void;
}

/**
 * Shared Full-App-Backup actions used by both the Character page and the
 * Chronicle page. Centralizes:
 *   - the hidden `<input type="file">` ref the page renders
 *   - the export-all download trigger
 *   - the import flow with envelope auto-detection (v2 app backup → full
 *     importer; v1 character-only backup → legacy importer fallback)
 *   - toast messaging in the active language
 *
 * Pages still render their own visible Backup button / dropdown — only the
 * file plumbing and the toast wording live here.
 */
export function useAppBackupActions(options: Options = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS["en"];

  const handleExportAll = () => {
    const filename = downloadAppBackup();
    const c = getCharacters().length;
    const counts =
      c === 0
        ? (strings.full_backup_includes ||
          "Includes characters, inventories, chronicles, sessions, locations, and relationships.")
        : `${c} ${c === 1 ? "character" : "characters"} + any chronicle data`;
    // Append the actual filename so the user knows what to look for in
    // their Downloads folder.
    const savedAs = `\n${strings.full_backup_saved_as || "Saved as"}: ${filename}`;
    toast({
      title: strings.full_backup_downloaded || "Full backup downloaded",
      description: counts + savedAs,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") throw new Error("Failed to read file");
        const parsed = JSON.parse(text);

        if (isAppBackupV2(parsed)) {
          const result = importAppBackup(parsed);
          if (typeof result === "string") {
            toast({
              title:
                strings.full_backup_import_failed || "Backup import failed",
              description: result,
              variant: "destructive",
            });
            return;
          }
          const c = result.importedCounts;
          const parts: string[] = [];
          if (c.characters)
            parts.push(
              `${c.characters} ${c.characters === 1 ? "character" : "characters"}`
            );
          if (c.chronicles)
            parts.push(
              `${c.chronicles} ${c.chronicles === 1 ? "chronicle" : "chronicles"}`
            );
          if (c.chronicleSessions)
            parts.push(
              `${c.chronicleSessions} ${c.chronicleSessions === 1 ? "session" : "sessions"}`
            );
          if (c.chronicleLocations)
            parts.push(
              `${c.chronicleLocations} ${c.chronicleLocations === 1 ? "location" : "locations"}`
            );
          if (c.chronicleRelationships)
            parts.push(
              `${c.chronicleRelationships} ${c.chronicleRelationships === 1 ? "relationship" : "relationships"}`
            );
          const renamedNote =
            result.renamedCharacters > 0
              ? ` (${result.renamedCharacters} ${strings.char_backup_renamed || "renamed"})`
              : "";
          toast({
            title: strings.full_backup_imported || "Backup imported",
            description:
              (parts.length > 0
                ? parts.join(", ")
                : strings.full_backup_empty_note || "Empty backup.") +
              renamedNote,
          });
          options.onAfterImport?.();
        } else {
          // Legacy v1 character-only backup. Still loadable so anyone with
          // an existing pre-v2 backup can restore characters.
          const result = importCharacterBackup(parsed);
          if (typeof result === "string") {
            toast({
              title:
                strings.full_backup_import_failed || "Backup import failed",
              description: result,
              variant: "destructive",
            });
            return;
          }
          const renamedNote =
            result.renamed > 0
              ? ` (${result.renamed} ${strings.char_backup_renamed || "renamed"})`
              : "";
          toast({
            title: strings.full_backup_imported || "Backup imported",
            description: `${result.imported} ${result.imported === 1 ? "character" : "characters"}${renamedNote}`,
          });
          options.onAfterImport?.();
        }
      } catch (err) {
        toast({
          title: strings.full_backup_import_failed || "Backup import failed",
          description:
            strings.full_backup_import_invalid_hint ||
            strings.char_import_invalid_json ||
            "The selected file isn't a valid VTM Companion backup. Pick a .json file you exported from this app.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-selected.
    e.target.value = "";
  };

  return {
    fileInputRef,
    handleExportAll,
    handleImportClick,
    handleImportFile,
  };
}
