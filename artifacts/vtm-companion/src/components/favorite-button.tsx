import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { cn } from "@/lib/utils";
import { FavoriteType, makeFavoriteKey } from "@/utils/favorites";

interface FavoriteButtonProps {
  /**
   * Legacy: raw favorite key. Used by clans/disciplines/rules whose ids are
   * already effectively namespaced by their data origin. New callers should
   * prefer `type` + `targetId`.
   */
  id?: string;
  /** Typed favorite — pair with `targetId`. Required for character/chronicle. */
  type?: FavoriteType;
  /** Required when `type` is provided. */
  targetId?: string;
  className?: string;
}

export function FavoriteButton({ id, type, targetId, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  // Resolve the storage key. Prefer (type + targetId) when supplied.
  const resolvedKey =
    type && targetId ? makeFavoriteKey(type, targetId) : (id ?? '');

  if (!resolvedKey) return null;

  const active = isFavorite(resolvedKey);
  const titleAdd = strings.favorite_add || 'Add to favorites';
  const titleRemove = strings.favorite_remove || 'Remove from favorites';
  const title = active ? titleRemove : titleAdd;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full transition-colors hover:bg-white/10 hover:text-primary",
        active && "text-primary",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(resolvedKey);
      }}
      data-testid={`btn-favorite-${resolvedKey}`}
      aria-pressed={active}
      aria-label={title}
      title={title}
    >
      <Heart className={cn("h-5 w-5", active && "fill-current")} />
    </Button>
  );
}
