import type { SizeGuide } from "@/types";

const DEFAULT_COLUMNS = ["Размер", "Цээж (см)", "Урт (см)"];
const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const LEGACY_MEASUREMENTS: Record<string, [string, string]> = {
  S: ["96–100", "66"],
  M: ["100–106", "69"],
  L: ["106–112", "72"],
  XL: ["112–118", "75"],
};

function uniqueLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  return labels
    .map((label) => label.trim())
    .filter((label) => {
      if (!label) return false;
      const key = label.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function defaultGuide(sizeLabels: string[]): SizeGuide {
  const sizes = uniqueLabels(sizeLabels);
  const rows = (sizes.length > 0 ? sizes : DEFAULT_SIZES).map((size) => {
    const measurements = LEGACY_MEASUREMENTS[size.toUpperCase()] ?? ["", ""];
    return [size, ...measurements];
  });

  return {
    title: "Размерын заавар",
    description: "",
    columns: [...DEFAULT_COLUMNS],
    rows,
  };
}

/** Safely converts database JSON into the editable size-guide shape. */
export function resolveSizeGuide(
  value: unknown,
  availableSizes: string[] = []
): SizeGuide {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultGuide(availableSizes);
  }

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.columns) || !Array.isArray(candidate.rows)) {
    return defaultGuide(availableSizes);
  }

  const columns = candidate.columns
    .slice(0, 12)
    .map((column, index) =>
      typeof column === "string" && column.trim()
        ? column.trim()
        : `Багана ${index + 1}`
    );

  if (columns.length === 0) return defaultGuide(availableSizes);

  const rows = candidate.rows
    .slice(0, 100)
    .filter(Array.isArray)
    .map((row) =>
      columns.map((_, index) => {
        const cell = row[index];
        return typeof cell === "string" || typeof cell === "number"
          ? String(cell).trim()
          : "";
      })
    )
    .filter((row) => row.some(Boolean));

  return {
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim()
        : "Размерын заавар",
    description:
      typeof candidate.description === "string"
        ? candidate.description.trim()
        : "",
    columns,
    rows,
  };
}

/** Removes empty guide rows before the JSON value is persisted. */
export function prepareSizeGuide(guide: SizeGuide): SizeGuide {
  const columns = guide.columns.map((column, index) =>
    column.trim() ? column.trim() : `Багана ${index + 1}`
  );

  return {
    title: guide.title.trim() || "Размерын заавар",
    description: guide.description.trim(),
    columns,
    rows: guide.rows
      .map((row) => columns.map((_, index) => row[index]?.trim() ?? ""))
      .filter((row) => row.some(Boolean)),
  };
}
