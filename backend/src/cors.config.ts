const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost'];

export function getAllowedOrigins(frontendUrl?: string) {
  const configuredOrigins =
    frontendUrl
      ?.split(',')
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean) ?? [];

  return Array.from(
    new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]),
  );
}

export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(normalizeOrigin(origin));
}

function normalizeOrigin(origin: string) {
  const value = origin.trim();

  if (!value) {
    return '';
  }

  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
}
