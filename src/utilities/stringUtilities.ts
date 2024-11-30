export function toProperCase(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function splitAtUpperCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}
