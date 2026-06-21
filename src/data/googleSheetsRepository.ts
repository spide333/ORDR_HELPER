import Papa from "papaparse";
import { gradeOrder, type Character, type Grade } from "../domain/character";
import { defaultStatDefinitions, type StatDefinition } from "../domain/stats";
import { mapCharacterRow } from "./characterMapper";

type FetchLike = (input: string) => Promise<Pick<Response, "ok" | "status" | "text">>;
type CsvRow = Record<string, unknown>;

export type CharacterData = {
  characters: Character[];
  statDefinitions: StatDefinition[];
};

function stringValue(row: CsvRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function optionalBooleanValue(row: CsvRow, key: string, fallback: boolean): boolean {
  const normalized = stringValue(row, key).toLowerCase();
  if (normalized.length === 0) {
    return fallback;
  }

  if (normalized === "true" || normalized === "1" || normalized === "y" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "n" || normalized === "no") {
    return false;
  }

  return fallback;
}

function hasSupportedGrade(row: CsvRow): boolean {
  return gradeOrder.includes(stringValue(row, "grade") as Grade);
}

async function parseCsvUrl(csvUrl: string, fetcher: FetchLike): Promise<CsvRow[]> {
  const response = await fetcher(csvUrl);

  if (!response.ok) {
    throw new Error(`Failed to load Google Sheets CSV: ${response.status}`);
  }

  const csv = await response.text();
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse Google Sheets CSV: ${parsed.errors[0].message}`);
  }

  return parsed.data;
}

function mapStatDefinitionRow(row: CsvRow, index: number): StatDefinition {
  const key = stringValue(row, "key");
  if (!key) {
    throw new Error(`Missing stat key at row ${index + 1}`);
  }

  return {
    key,
    label: stringValue(row, "label") || key,
    order: index + 1,
    enabled: optionalBooleanValue(row, "enabled", true),
    important: optionalBooleanValue(row, "important", false),
    includeInTotal: optionalBooleanValue(row, "includeInTotal", true)
  };
}

export async function loadCharactersFromCsvUrl(
  csvUrl: string,
  fetcher: FetchLike = fetch,
  statDefinitions: StatDefinition[] = defaultStatDefinitions,
): Promise<Character[]> {
  const rows = await parseCsvUrl(csvUrl, fetcher);

  return rows
    .filter((row) => stringValue(row, "id").length > 0)
    .filter(hasSupportedGrade)
    .map((row) => mapCharacterRow(row, statDefinitions));
}

export async function loadStatDefinitionsFromCsvUrl(
  csvUrl: string,
  fetcher: FetchLike = fetch,
): Promise<StatDefinition[]> {
  const rows = await parseCsvUrl(csvUrl, fetcher);

  return rows.map(mapStatDefinitionRow);
}

export async function loadCharacterDataFromCsvUrls(
  charactersCsvUrl: string,
  statDefinitionsCsvUrl?: string,
  fetcher: FetchLike = fetch,
): Promise<CharacterData> {
  const statDefinitions = statDefinitionsCsvUrl
    ? await loadStatDefinitionsFromCsvUrl(statDefinitionsCsvUrl, fetcher)
    : defaultStatDefinitions;
  const characters = await loadCharactersFromCsvUrl(charactersCsvUrl, fetcher, statDefinitions);

  return {
    characters,
    statDefinitions
  };
}
