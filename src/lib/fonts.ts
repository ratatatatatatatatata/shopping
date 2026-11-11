import {
  Cormorant_Garamond,
  Instrument_Serif,
  Jost,
  UnifrakturMaguntia,
} from "next/font/google";

/** Gothic blackletter logo on the garment rail (Latin only). */
export const blackletter = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-blackletter",
  display: "swap",
});

/** Italic serif for product names in the rail detail view. */
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

/** Cyrillic fallback for the italic serif (Instrument Serif has no Cyrillic). */
export const cormorant = Cormorant_Garamond({
  weight: "500",
  style: "italic",
  subsets: ["latin", "cyrillic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Geometric sans used by the balloon-drop section. */
export const jost = Jost({
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-jost",
  display: "swap",
});
