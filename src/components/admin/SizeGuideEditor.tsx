"use client";

import { Plus, Ruler, Trash2, WandSparkles } from "lucide-react";
import type { SizeGuide } from "@/types";

export function SizeGuideEditor({
  guide,
  availableSizes,
  onChange,
}: {
  guide: SizeGuide;
  availableSizes: string[];
  onChange: (guide: SizeGuide) => void;
}) {
  const knownSizes = new Set(
    guide.rows.map((row) => row[0]?.trim().toLocaleLowerCase()).filter(Boolean)
  );
  const missingSizes = availableSizes.filter(
    (size) => !knownSizes.has(size.trim().toLocaleLowerCase())
  );

  function updateColumn(index: number, value: string) {
    onChange({
      ...guide,
      columns: guide.columns.map((column, i) =>
        i === index ? value : column
      ),
    });
  }

  function addColumn() {
    onChange({
      ...guide,
      columns: [...guide.columns, "Шинэ хэмжээс"],
      rows: guide.rows.map((row) => [...row, ""]),
    });
  }

  function removeColumn(index: number) {
    if (guide.columns.length <= 1) return;
    onChange({
      ...guide,
      columns: guide.columns.filter((_, i) => i !== index),
      rows: guide.rows.map((row) => row.filter((_, i) => i !== index)),
    });
  }

  function updateCell(rowIndex: number, columnIndex: number, value: string) {
    onChange({
      ...guide,
      rows: guide.rows.map((row, ri) =>
        ri === rowIndex
          ? guide.columns.map((_, ci) =>
              ci === columnIndex ? value : (row[ci] ?? "")
            )
          : row
      ),
    });
  }

  function addRow(size = "") {
    onChange({
      ...guide,
      rows: [
        ...guide.rows,
        guide.columns.map((_, index) => (index === 0 ? size : "")),
      ],
    });
  }

  function addMissingSizes() {
    if (missingSizes.length === 0) return;
    onChange({
      ...guide,
      rows: [
        ...guide.rows,
        ...missingSizes.map((size) =>
          guide.columns.map((_, index) => (index === 0 ? size : ""))
        ),
      ],
    });
  }

  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Ruler className="h-5 w-5" /> Размерын заавар
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        Барааны дэлгэрэнгүй дээр харагдах гарчиг, хэмжээсийн багана, бүх
        размерын утгыг эндээс өөрчилнө. Тоон размер болон XS, 2XL зэрэг дурын
        утга оруулж болно.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Товчны гарчиг</label>
          <input
            className="input"
            value={guide.title}
            onChange={(event) =>
              onChange({ ...guide, title: event.target.value })
            }
            placeholder="Размерын заавар"
          />
        </div>
        <div>
          <label className="label">Нэмэлт тайлбар</label>
          <input
            className="input"
            value={guide.description}
            onChange={(event) =>
              onChange({ ...guide, description: event.target.value })
            }
            placeholder="Жишээ: Хэмжээсүүд сантиметрээр"
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {guide.columns.map((column, columnIndex) => (
                <th
                  key={`column-${columnIndex}`}
                  className="min-w-40 border-b border-ink/10 px-1 pb-2 text-left"
                >
                  <div className="flex items-center gap-1">
                    <input
                      className="input !py-2 text-xs font-semibold"
                      value={column}
                      onChange={(event) =>
                        updateColumn(columnIndex, event.target.value)
                      }
                      aria-label={`Багана ${columnIndex + 1}-ийн нэр`}
                    />
                    {guide.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(columnIndex)}
                        className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                        aria-label={`${column || `Багана ${columnIndex + 1}`} устгах`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 border-b border-ink/10" />
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {guide.columns.map((column, columnIndex) => (
                  <td key={`cell-${columnIndex}`} className="px-1 pt-2">
                    <input
                      className="input !py-2 text-xs"
                      value={row[columnIndex] ?? ""}
                      onChange={(event) =>
                        updateCell(rowIndex, columnIndex, event.target.value)
                      }
                      placeholder={columnIndex === 0 ? "S / 2XL / 32" : column}
                      aria-label={`${rowIndex + 1}-р мөр, ${column}`}
                    />
                  </td>
                ))}
                <td className="px-1 pt-2 align-middle">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...guide,
                        rows: guide.rows.filter((_, index) => index !== rowIndex),
                      })
                    }
                    className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={`${row[0] || `${rowIndex + 1}-р мөр`} устгах`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addRow()}
          className="btn-outline !px-3 !py-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Мөр нэмэх
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="btn-outline !px-3 !py-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Багана нэмэх
        </button>
        <button
          type="button"
          onClick={addMissingSizes}
          disabled={missingSizes.length === 0}
          className="btn-outline !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Барааны размеруудаас нөхөх
          {missingSizes.length > 0 ? ` (${missingSizes.length})` : ""}
        </button>
      </div>
    </div>
  );
}
