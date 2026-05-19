import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

export default function NotFound() {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-red-950/20 border border-red-900/50 p-8 rounded-lg max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-serif text-red-500">404</h1>
        </div>
        <p className="text-zinc-300 mb-6 text-base">
          {strings.notFoundTitle || "This page does not exist."}
        </p>
        <Link href="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            {strings.home || "Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
