export interface Rule {
  id: string;
  title: string;
  category: string;
  shortExplanation: string;
  fullExplanation: string;
  examples: string[];
  quickNotes: string[];
  tags: string[];
}

export const rules: Rule[] = [
  {
    id: "dice-pools",
    title: "Reserva de Dados (Dice Pools)",
    category: "Tiradas",
    shortExplanation: "Se tiran d10s equivalentes a Atributo + Habilidad. Los éxitos son 6 o más.",
    fullExplanation: "En V5, casi todas las acciones se resuelden tirando una reserva de dados de 10 caras (d10). La reserva se calcula sumando un Atributo y una Habilidad relevante a la acción. Cada dado que muestra un 6, 7, 8, 9 o 10 es un Éxito. Los resultados de 10 también pueden generar críticos si se obtienen en pares. Si la cantidad de éxitos iguala o supera la Dificultad establecida por el Narrador, la acción tiene éxito.",
    examples: [
      "Disparar un arma: Destreza (3) + Armas de Fuego (2) = 5 dados.",
      "Convencer a un guardia: Manipulación (4) + Persuasión (3) = 7 dados."
    ],
    quickNotes: [
      "Éxito: 6 o más.",
      "Fallo: 5 o menos.",
      "10s: Cuentan como un éxito, pero un par de 10s cuenta como 4 éxitos (Crítico)."
    ],
    tags: ["básico", "tiradas", "sistema"]
  },
  {
    id: "hunger-dice",
    title: "Dados de Hambre",
    category: "Hambre",
    shortExplanation: "Reemplaza dados normales por Dados de Hambre igual a tu nivel de Hambre (1-5).",
    fullExplanation: "Los vampiros siempre están hambrientos. Tu nivel de Hambre va del 1 al 5 (siendo 5 el punto de inanición/frenesí inminente). Al armar tu reserva de dados para cualquier acción, debes reemplazar una cantidad de dados normales (negros) igual a tu nivel de Hambre por Dados de Hambre (rojos). Estos dados especiales funcionan igual para determinar éxitos (6+), pero si sacas un '1' o un '10' en un dado rojo, pueden ocurrir Fallos Bestiales o Críticos Desastrosos.",
    examples: [
      "Reserva de 6 dados con Hambre 2: Tiras 4 dados normales y 2 dados de Hambre rojos."
    ],
    quickNotes: [
      "Nunca puedes tirar más dados rojos que tu reserva total.",
      "Los dados rojos no cambian la probabilidad matemática base, pero añaden riesgo de narrativa."
    ],
    tags: ["hambre", "bestia", "sistema"]
  },
  {
    id: "messy-critical",
    title: "Crítico Desastroso (Messy Critical)",
    category: "Hambre",
    shortExplanation: "Ocurre cuando sacas un crítico (dos 10s) y al menos uno de esos 10s está en un Dado de Hambre.",
    fullExplanation: "La acción tiene un éxito rotundo, pero la Bestia toma el control momentáneamente para lograrlo. Haces exactamente lo que querías, pero de una manera brutal, descarada, ruidosa o monstruosa que probablemente cause problemas colaterales, rompa la Mascarada o dañe tu Humanidad.",
    examples: [
      "Querías intimidar al guardia para que te deje pasar, pero en un Crítico Desastroso, le rompes el brazo o le muerdes la cara delante de testigos.",
      "Al investigar una habitación, la destrozas por completo buscando la pista."
    ],
    quickNotes: [
      "La acción SIEMPRE tiene éxito.",
      "Las consecuencias narrativas son dictadas por el Narrador."
    ],
    tags: ["hambre", "crítico", "bestia"]
  },
  {
    id: "bestial-failure",
    title: "Fallo Bestial",
    category: "Hambre",
    shortExplanation: "Ocurre cuando fallas la tirada (no alcanzas la dificultad) Y tienes al menos un '1' en un Dado de Hambre.",
    fullExplanation: "No solo fallas en tu intento, sino que tu Bestia reacciona a la frustración. El vampiro debe actuar de forma impulsiva o la Bestia manifiesta una Compulsión (relacionada con su clan o la situación). Esto puede desencadenar hambre incontrolable, paranoia, o agresión.",
    examples: [
      "Intentas saltar un muro y fallas. El '1' rojo significa que, en tu frustración, atacas lo que esté más cerca o gritas rompiendo el sigilo."
    ],
    quickNotes: [
      "El Narrador aplica una Compulsión o una consecuencia narrativa.",
      "A veces se puede usar Fuerza de Voluntad para ignorar una Compulsión temporalmente (Regla Opcional)."
    ],
    tags: ["hambre", "fallo", "bestia"]
  },
  {
    id: "rouse-check",
    title: "Control de Enardecimiento (Rouse Check)",
    category: "Hambre",
    shortExplanation: "Tira 1 dado normal al despertar, curarse o usar poderes. Si sale 1-5, el Hambre aumenta en 1.",
    fullExplanation: "La magia de la sangre (Disciplinas), curar daño, o despertar cada noche consume Vitae. En V5, esto no es un coste fijo, sino un riesgo. Al hacer un Rouse Check, tiras un solo dado (normal, sin modificadores). Si el resultado es 6 o superior, la sangre rinde y no tienes más hambre. Si el resultado es de 1 a 5, tu Hambre aumenta en 1 punto.",
    examples: [
      "Despertar cada atardecer requiere 1 Rouse Check.",
      "Usar Celeridad nivel 2 requiere 1 Rouse Check."
    ],
    quickNotes: [
      "Hambre Máxima es 5. Si fallas un Rouse Check teniendo Hambre 5, entras en Frenesí de Hambre o letargo.",
      "Potencia de Sangre alta permite repetir dados en ciertos Rouse Checks de Disciplinas."
    ],
    tags: ["hambre", "coste", "sangre"]
  },
  {
    id: "frenzy",
    title: "Frenesí",
    category: "Frenesí",
    shortExplanation: "Pérdida de control ante provocación, fuego, luz solar o hambre extrema.",
    fullExplanation: "Cuando la Bestia es provocada por peligro de muerte (fuego/sol), hambre extrema, o furia/humillación, el vampiro debe tirar para resistir el Frenesí. La tirada de resistencia es Voluntad (Willpower) vs una Dificultad basada en la provocación (generalmente 2 o 3, pero hasta 4 para fuego directo). Si falla, el vampiro ataca, huye o devora compulsivamente, y el jugador pierde el control temporalmente.",
    examples: [
      "Alguien te insulta gravemente (Dificultad 2 Furia).",
      "Ves fuego en la misma habitación (Dificultad 3 Terror)."
    ],
    quickNotes: [
      "Hambre (Hunger Frenzy): Dificultad = Nivel de Hambre.",
      "Terror (Rötschreck): Huir desesperadamente de la fuente.",
      "Furia (Fury): Atacar y destruir la fuente de la provocación."
    ],
    tags: ["bestia", "fuego", "sol"]
  },
  {
    id: "combat",
    title: "Resolución de Combate",
    category: "Combate",
    shortExplanation: "Tiradas enfrentadas. El ganador hace daño igual a sus (Éxitos - Éxitos del perdedor) + Modificador del arma.",
    fullExplanation: "En un turno de combate físico, el atacante y el defensor tiran sus reservas enfrentadas (ej: Fuerza + Pelea vs Fuerza + Pelea para cuerpo a cuerpo, o Destreza + Atletismo para esquivar). El que saque más éxitos gana el choque. Si gana el atacante, inflige daño igual a su Margen de Éxito (Éxitos propios menos éxitos del defensor), MÁS el daño base del arma utilizada. Si gana el defensor (y estaba contraatacando), el defensor inflige el daño.",
    examples: [
      "Atacante (5 éxitos) vs Defensor (2 éxitos). Margen = 3. Arma (Espada, Daño +2). Daño total = 5."
    ],
    quickNotes: [
      "Ataque a distancia desde cobertura no puede ser contraatacado cuerpo a cuerpo.",
      "Esquivar (usando Atletismo) no hace daño al ganar, solo evita recibirlo."
    ],
    tags: ["pelea", "daño", "enfrentado"]
  },
  {
    id: "damage-types",
    title: "Daño Superficial y Agravado",
    category: "Combate",
    shortExplanation: "Los vampiros dividen el daño físico normal a la mitad (Superficial). El sol y el fuego hacen daño total (Agravado).",
    fullExplanation: "Daño Superficial incluye puñetazos, balas y espadas. Cuando un vampiro recibe Daño Superficial, la cantidad total se DIVIDE A LA MITAD (redondeando hacia arriba) antes de marcarse en el medidor de Salud. El Daño Agravado (fuego, sol, garras de otro vampiro/lobo) se marca completo sin dividir. Si se llena el medidor de salud con Superficial, el personaje está Impedido. Si se llena de Agravado, entra en Letargo (vampiros) o muere (humanos).",
    examples: [
      "Recibes 5 daños de bala. Divides a la mitad: marcas 3 puntos de Daño Superficial en Salud.",
      "Recibes 3 de daño de fuego. Marcas 3 de Daño Agravado en Salud."
    ],
    quickNotes: [
      "Curar 1 Superficial = 1 Rouse Check en tu turno.",
      "Curar 1 Agravado = 3 Rouse Checks, solo se puede curar 1 al final del día al dormir."
    ],
    tags: ["salud", "curación", "armas"]
  },
  {
    id: "willpower",
    title: "Fuerza de Voluntad (Willpower)",
    category: "Voluntad",
    shortExplanation: "Gasta 1 punto para repetir hasta 3 dados normales fallidos o resistir impulsos.",
    fullExplanation: "Los puntos de Voluntad representan el empuje mental. Puedes gastar 1 punto de Voluntad marcado como daño superficial en tu medidor mental para: 1) Repetir hasta 3 dados regulares (NO dados de hambre ni críticos/1s ya sacados) en una tirada que acabas de hacer. 2) Tomar el control de tu personaje por 1 turno durante un Frenesí. 3) Ignorar penalizadores por heridas graves durante 1 escena.",
    examples: [
      "Sacas 1, 2, 3, 6, 8 (2 éxitos). Gastas 1 Voluntad y vuelves a tirar el 1, 2 y 3. Caen 6, 9 y 4. Ahora tienes 4 éxitos."
    ],
    quickNotes: [
      "Recuperación: Interpretar tu Aspiración (recupera superficial) o Actuar acorde a tus Convicciones."
    ],
    tags: ["repetición", "mental"]
  },
  {
    id: "humanity",
    title: "Humanidad y Manchas",
    category: "Humanidad",
    shortExplanation: "Transgredir Conviciones genera Manchas. Demasiadas manchas reducen tu Humanidad.",
    fullExplanation: "Al violar una de las Convicciones de la crónica o de tu personaje (ej. 'No matar inocentes'), adquieres una o más Manchas (Stains) en tu medidor de Humanidad. Al final de la sesión, si tienes Manchas, haces una tirada de Remordimiento (Remorse). Tiras un número de dados igual a las casillas sin marcar en tu medidor de Humanidad. Si sacas al menos un éxito, limpias las Manchas y conservas tu Humanidad (sientes culpa). Si fallas, tu Humanidad baja un punto permanentemente.",
    examples: [
      "Tu convicción es 'Proteger a los débiles'. En un combate, dejas morir a un vagabundo. Ganas 1 Mancha."
    ],
    quickNotes: [
      "A mayor Humanidad, más casillas sin marcar, más fácil sentir Remordimiento.",
      "Humanidad 0: Pierdes el personaje a la Bestia de forma irreversible (Wight)."
    ],
    tags: ["moralidad", "bestia"]
  }
];