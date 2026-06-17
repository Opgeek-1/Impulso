export function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.search(/[\[{]/);
  if (start === -1) return text.trim();

  const opener = text[start];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener || ch === (opener === "[" ? "{" : "[")) depth++;
    if (ch === closer || ch === (closer === "]" ? "}" : "]")) depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }

  return text.slice(start);
}
