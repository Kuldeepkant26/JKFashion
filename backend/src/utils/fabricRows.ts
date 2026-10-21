import type { Document } from "mongoose";
import { FABRIC_ROW_FIELDS, LEGACY_FABRIC_FIELDS, type IFabricRow } from "../models/fabricRow.js";

/** A sample or order as far as fabric goes: rows, or (saved before rows) the flat fields. */
export type FabricSource = Partial<IFabricRow> & { fabrics?: Partial<IFabricRow>[] | null };

const blankRow = (): IFabricRow => ({
  fabricType: "",
  fabricWidth: "",
  yarnType: "",
  optionNumber: "",
  yarnColor: "",
});

/**
 * Rows as stored: each field a trimmed string, and a row with nothing in it
 * dropped — the forms always offer one row, and leaving it blank means "no
 * fabric yet", not an empty fabric.
 */
export const cleanFabricRows = (rows: unknown): IFabricRow[] =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const source = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
      const clean = blankRow();
      for (const field of FABRIC_ROW_FIELDS) {
        const value = source[field];
        clean[field] = typeof value === "string" ? value.trim() : value == null ? "" : String(value);
      }
      return clean;
    })
    .filter((row) => FABRIC_ROW_FIELDS.some((field) => row[field] !== ""));

/**
 * A record's fabric rows. One saved before rows existed has its fabric in the
 * legacy flat fields; until the migration moves it, that reads as the first
 * row, so nothing entered then goes missing.
 */
export const fabricRows = (record: FabricSource): IFabricRow[] => {
  if (record.fabrics?.length) return cleanFabricRows(record.fabrics);
  return cleanFabricRows([
    {
      fabricType: record.fabricType,
      fabricWidth: record.fabricWidth,
      yarnType: record.yarnType,
      yarnColor: record.yarnColor,
    },
  ]);
};

/** A plain record for the API: its rows, and the legacy fields kept internal. */
export const withFabricRows = <T extends Record<string, unknown>>(plain: T) => {
  const rest: Record<string, unknown> = { ...plain };
  for (const field of LEGACY_FABRIC_FIELDS) delete rest[field];
  return { ...rest, fabrics: fabricRows(plain as FabricSource) };
};

/**
 * Replace a document's rows. Writing them also clears the legacy flat
 * fields, which would otherwise come back as a first row the moment the rows
 * were emptied.
 */
export const setFabricRows = (doc: Document, rows: unknown): void => {
  doc.set("fabrics", cleanFabricRows(rows));
  for (const field of LEGACY_FABRIC_FIELDS) doc.set(field, undefined);
};
