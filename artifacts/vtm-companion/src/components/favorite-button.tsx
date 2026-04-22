import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id, className }: { id: string, className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(id);

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
        toggleFavorite(id);
      }}
      data-testid={`btn-favorite-${id}`}
      title={active ? "Remover de favoritos" : "Añadir a favoritos"}
    >
      <Heart className={cn("h-5 w-5", active && "fill-current")} />
    </Button>
  );
}