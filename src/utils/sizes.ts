type SizeVariantLike = {
  size: string | null | undefined;
  stock_quantity: number | null | undefined;
  status: string | null | undefined;
};

const SIZE_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function normalizeSizeKey(size: string): string {
  return size.trim().replace(/\s+/g, " ").toUpperCase();
}

function apparelSizeRank(size: string): number | null {
  if (size === "S") return 20;
  if (size === "M") return 30;
  if (size === "L") return 40;

  const repeatedXs = size.match(/^(X+)S$/);
  if (repeatedXs) return 20 - repeatedXs[1].length;

  const numberedXs = size.match(/^(\d+)XS$/);
  if (numberedXs) return 20 - Number(numberedXs[1]);

  const repeatedXl = size.match(/^(X+)L$/);
  if (repeatedXl) return 40 + repeatedXl[1].length;

  const numberedXl = size.match(/^(\d+)XL$/);
  if (numberedXl) return 40 + Number(numberedXl[1]);

  return null;
}

export function compareSizes(a: string, b: string): number {
  const normalizedA = normalizeSizeKey(a);
  const normalizedB = normalizeSizeKey(b);
  const apparelRankA = apparelSizeRank(normalizedA);
  const apparelRankB = apparelSizeRank(normalizedB);

  if (apparelRankA !== null || apparelRankB !== null) {
    if (apparelRankA === null) return 1;
    if (apparelRankB === null) return -1;
    if (apparelRankA !== apparelRankB) return apparelRankA - apparelRankB;
    return SIZE_COLLATOR.compare(normalizedA, normalizedB);
  }

  const numericA = /^\d+(?:\.\d+)?$/.test(normalizedA);
  const numericB = /^\d+(?:\.\d+)?$/.test(normalizedB);

  if (numericA !== numericB) return numericA ? -1 : 1;
  return SIZE_COLLATOR.compare(normalizedA, normalizedB);
}

export function isAvailableSizeVariant(variant: SizeVariantLike): boolean {
  return (
    variant.status === "active" &&
    Number(variant.stock_quantity) > 0 &&
    normalizeSizeKey(variant.size ?? "").length > 0
  );
}

export function uniqueSortedAvailableSizes(
  variants: readonly SizeVariantLike[]
): string[] {
  const uniqueSizes = new Map<string, string>();

  for (const variant of variants) {
    if (!isAvailableSizeVariant(variant)) continue;

    const size = (variant.size ?? "").trim().replace(/\s+/g, " ");
    const key = normalizeSizeKey(size);
    if (!uniqueSizes.has(key)) uniqueSizes.set(key, size);
  }

  return [...uniqueSizes.values()].sort(compareSizes);
}
