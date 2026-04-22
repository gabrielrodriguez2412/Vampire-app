import { GlossaryEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const glossary: GlossaryEntry[] = [
  {
    id: "masquerade",
    term: { es: "La Mascarada", en: "The Masquerade", pt: "", fr: "", de: "", it: "" },
    definition: { es: "Ocultar lo sobrenatural.", en: "Hiding the supernatural.", pt: "", fr: "", de: "", it: "" },
    related: ["camarilla", "prince"]
  },
  {
    id: "vitae",
    term: fallbackStr("Vitae"),
    definition: fallbackStr("Vampire blood."),
    related: ["ghoul"]
  }
];