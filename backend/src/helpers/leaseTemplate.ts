/**
 * Compiles a "fill in the blanks" line template (e.g. `{ip} {mac} {hostname} {expiry}`)
 * into a regex, so an admin can describe one example output line instead of
 * writing raw regex. Literal text/whitespace between placeholders is matched
 * as-is (whitespace runs become `\s+`); only one record per line is supported.
 */

const PLACEHOLDER_PATTERNS: Record<string, string> = {
  ip: '(\\d{1,3}(?:\\.\\d{1,3}){3})',
  mac: '([0-9a-fA-F]{2}(?:[:-][0-9a-fA-F]{2}){5})',
  hostname: '(\\S+)',
  expiry: '(\\S+)',
};

const PLACEHOLDER_TOKEN = /\{(ip|mac|hostname|expiry)\}/g;

function escapeLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

export type CompiledLeaseTemplate = {
  regex: RegExp;
  /** Capture group index (1-based) -> field name, in the order they appear in the template. */
  fields: string[];
};

export function compileLeaseTemplate(template: string): CompiledLeaseTemplate {
  if (!template || !template.trim()) {
    throw new Error('Lease line template is empty');
  }

  const fields: string[] = [];
  let pattern = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  PLACEHOLDER_TOKEN.lastIndex = 0;
  while ((match = PLACEHOLDER_TOKEN.exec(template)) !== null) {
    pattern += escapeLiteral(template.slice(lastIndex, match.index));
    const field = match[1];
    pattern += PLACEHOLDER_PATTERNS[field];
    fields.push(field);
    lastIndex = PLACEHOLDER_TOKEN.lastIndex;
  }
  pattern += escapeLiteral(template.slice(lastIndex));

  if (fields.length === 0) {
    throw new Error('Lease line template has no {ip}/{mac}/{hostname}/{expiry} placeholders');
  }
  if (!fields.includes('ip')) {
    throw new Error('Lease line template must include {ip}');
  }

  return { regex: new RegExp(pattern), fields };
}

export type ParsedLeaseRecord = {
  ip: string;
  mac?: string;
  hostname?: string;
  expiry?: string;
};

/** Applies the compiled template to each line of command output; non-matching lines (headers, blanks) are skipped silently. */
export function parseLeaseOutput(output: string, compiled: CompiledLeaseTemplate): ParsedLeaseRecord[] {
  const records: ParsedLeaseRecord[] = [];
  for (const line of output.split(/\r?\n/)) {
    const m = compiled.regex.exec(line);
    if (!m) continue;
    const record: ParsedLeaseRecord = { ip: '' };
    compiled.fields.forEach((field, i) => {
      (record as any)[field] = m[i + 1];
    });
    if (record.ip) records.push(record);
  }
  return records;
}
