const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? '';
const normalizedBaseUrl = rawBaseUrl.endsWith('/')
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

if (!rawBaseUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    '[backend-url] VITE_BACKEND_API_URL is not defined. Falling back to relative URLs.'
  );
}

export const BACKEND_API_BASE_URL = normalizedBaseUrl;

export const backendUrl = (path: string) => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${suffix}`;
};
