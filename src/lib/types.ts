export type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export type Dict<T = JSONValue> = Record<string, T>;