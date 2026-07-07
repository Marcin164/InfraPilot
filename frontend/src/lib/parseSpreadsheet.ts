import ExcelJS from "exceljs";

// Uses ExcelJS, not xlsx/SheetJS — xlsx has an unpatched prototype-pollution
// CVE (GHSA-4r6h-8v6p-xvw6) with no fix on the npm registry, and this parses
// files uploaded by whoever has access to Import/bulk-upload, so it's worth
// treating as untrusted input.
function formatCellValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10); // YYYY-MM-DD, matches the CSV template format
  }
  if (typeof value === "object") {
    if ("richText" in value) {
      return value.richText.map((t) => t.text).join("");
    }
    if ("text" in value) {
      return String(value.text ?? "");
    }
    if ("result" in value) {
      return String(value.result ?? "");
    }
    if ("hyperlink" in value) {
      return String(value.hyperlink ?? "");
    }
  }
  return String(value);
}

/**
 * Parses the first worksheet of an .xlsx/.xls file into an array of plain
 * objects keyed by the header row (row 1).
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    headers.forEach((key, colNumber) => {
      if (!key) return;
      obj[key] = formatCellValue(row.getCell(colNumber).value);
    });
    rows.push(obj);
  });

  return rows;
}
