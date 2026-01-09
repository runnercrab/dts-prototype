// src/lib/ui-tokens.ts
export const UI = {
  colors: {
    brandBlue: "#2563EB",
    brandBlueBg: "#EFF6FF",

    green: "#15803D",
    greenBg: "#ECFDF5",

    orange: "#FB923C",
    orangeBg: "#FFF7ED",

    neutral: "#64748B",
    neutralBg: "#F8FAFC",

    border: "#E2E8F0",
  },

  radius: {
    page: "rounded-2xl",
    card: "rounded-xl",
    chip: "rounded-full",
  },
} as const;

export type QuadrantKey = "quick_wins" | "big_bets" | "foundations" | "fill_ins";

export function quadrantStyle(q: QuadrantKey) {
  const c = UI.colors;
  switch (q) {
    case "quick_wins":
      return { border: c.brandBlue, bg: c.brandBlueBg, chipBg: c.brandBlue, chipText: "white" as const };
    case "big_bets":
      return { border: c.green, bg: c.greenBg, chipBg: c.green, chipText: "white" as const };
    case "foundations":
      return { border: c.orange, bg: c.orangeBg, chipBg: c.orange, chipText: "white" as const };
    default:
      return { border: c.border, bg: c.neutralBg, chipBg: c.neutral, chipText: "white" as const };
  }
}
