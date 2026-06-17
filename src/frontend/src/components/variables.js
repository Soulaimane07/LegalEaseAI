// Backend API base URL.
// Override per-machine WITHOUT editing this file: create `src/frontend/.env.local`
// with:   VITE_API_BASE_URL=http://<backend-host>:8010/api
// Default = localhost, correct when the frontend and backend run on the SAME machine
// (the typical setup for a developer testing locally).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8010/api";
