const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export const apiUrl = (path) =>
  path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${apiBaseUrl}${path}`;
