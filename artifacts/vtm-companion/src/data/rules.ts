import { RuleEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const rules: RuleEntry[] = [
  {
    id: "dice-pools",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    title: { es: "Reserva de Dados (Dice Pools)", en: "Dice Pools", pt: "", fr: "", de: "", it: "" },
    category: "Tiradas",
    shortExplanation: { es: "Tira d10s (Atributo + Habilidad).", en: "Roll d10s (Attribute + Skill).", pt: "", fr: "", de: "", it: "" },
    fullExplanation: fallbackStr("Full rules about dice pools."),
    examples: fallbackArr(["Shooting a gun."]),
    quickNotes: fallbackArr(["Success: 6+"]),
    tags: ["básico", "tiradas"]
  },
  {
    id: "hunger-dice",
    editions: ["v5"],
    title: fallbackStr("Dados de Hambre"),
    category: "Hambre",
    shortExplanation: fallbackStr("Reemplaza dados normales por Dados de Hambre."),
    fullExplanation: fallbackStr("Hunger mechanics in V5."),
    examples: fallbackArr(["Roll 6 dice with 2 hunger."]),
    quickNotes: fallbackArr(["Never more red dice than total pool."]),
    tags: ["hambre", "bestia"]
  }
];