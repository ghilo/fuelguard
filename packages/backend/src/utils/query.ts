export function qString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0]; // prend le premier
  return undefined;
}

export function qStringRequired(value: unknown, fieldName = "value"): string {
  const v = qString(value);
  if (!v) throw new Error(`Missing query param: ${fieldName}`);
  return v;
}