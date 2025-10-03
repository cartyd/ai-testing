// Utility function to safely parse JSON
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Utility to convert snake_case to camelCase
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Utility to convert camelCase to snake_case
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Utility to transform object keys from snake_case to camelCase
export function transformObjectKeys<T extends Record<string, any>>(
  obj: T,
  transformer: (key: string) => string = toCamelCase
): Record<string, any> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const transformedKey = transformer(key);
    acc[transformedKey] = obj[key];
    return acc;
  }, {} as Record<string, any>);
}

// Utility to transform snake_case API responses to camelCase
export function transformApiResponse<T extends Record<string, any>>(data: T): Record<string, any> {
  return transformObjectKeys(data, toCamelCase);
}

// Utility to delay execution
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility to validate required environment variables
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}