import { motion } from "framer-motion";
import { roleplay } from "@/data/roleplay";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { Drama } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, getLocalizedArray, isEditionInScope } from "@/utils/content";

/**
 * Roleplay tips page.
 *
 * - Localization: each tip's title and bullets are multilingual records
 *   read via `getText` / `getLocalizedArray`. Pre-batch-B the page
 *   rendered hardcoded Spanish in every locale; the locale switch now
 *   actually swaps the visible content.
 * - Edition filtering: each tip declares an `edition` scope
 *   (null = universal, 'v5' = V5-only, 'classic' = V20/Revised/2nd/1st-only).
 *   `isEditionInScope` decides what shows for the currently selected
 *   edition so V5-only cards do not appear when V20 is selected, and
 *   vice versa. Edition labels stay as small badges, but the filter is
 *   the source of truth — labels are advisory, not the gate.
 */
export default function Roleplay() {
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const visibleTips = roleplay.filter(tip => isEditionInScope(tip.edition, activeEdition));

  const editionLabel = (edition: 'v5' | 'classic' | null | undefined): string | null => {
    if (edition === 'v5') return strings.roleplay_edition_v5 || strings.combat_summary_v5_label || 'V5';
    if (edition === 'classic') return strings.roleplay_edition_classic || strings.combat_summary_classic_label || 'Classic';
    return null;
  };

  return (
    <div className="p-6 md:p-10 short-landscape:p-3 max-w-4xl mx-auto w-full">
      <div className="mb-8 short-landscape:mb-3">
        <BackLink to="/compendium" label={strings.back_to_compendium || "Back to Compendium"} className="mb-4 short-landscape:mb-2" />
        <h1 className="text-3xl short-landscape:text-xl font-serif font-bold text-primary mb-2 short-landscape:mb-1 flex items-center gap-3">
          <Drama className="w-8 h-8 short-landscape:w-5 short-landscape:h-5" />
          {strings.roleplaylabel || strings.roleplay || 'Roleplay'}
        </h1>
        <p className="text-muted-foreground short-landscape:text-sm">
          {strings.roleplaySubtitle || strings.roleplayIdeas || ''}
        </p>
      </div>

      <div className="space-y-8 short-landscape:space-y-4">
        {visibleTips.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            {strings.noResults || ''}
          </p>
        )}
        {visibleTips.map((section, i) => {
          const title = getText(section.title, activeLanguage) || section.id;
          const bullets = getLocalizedArray(section.content, activeLanguage);
          const badge = editionLabel(section.edition);
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className="bg-card border-border overflow-hidden group">
                <CardHeader className="bg-white/[0.02] border-b border-border">
                  <CardTitle className="font-serif text-xl text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                    <span className="min-w-0 flex-1">{title}</span>
                    {badge && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 border border-border px-1.5 py-0.5 rounded shrink-0">
                        {badge}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 short-landscape:p-3">
                  <ul className="space-y-4 short-landscape:space-y-2">
                    {bullets.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-foreground/80 leading-relaxed">
                        <span className="text-primary mt-1.5 opacity-60 text-xs">◆</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
