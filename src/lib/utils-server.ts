export function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braceMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (braceMatch) return braceMatch[0];
  return text.trim();
}
