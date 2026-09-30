export const appOrigin = import.meta.env.VITE_APP_ORIGIN || "https://kastanje-app-demo.gustavonline.workers.dev";
export const appUrl = (path = "/app") => appOrigin + path;
