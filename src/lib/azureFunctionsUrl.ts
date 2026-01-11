/**
 * Build a safe Azure Functions URL.
 *
 * Why:
 * - Some deployments accidentally set VITE_AZURE_FUNCTIONS_URL like `https://<app>.azurewebsites.net/?`
 *   which turns `/api/...` into a query string when concatenated, causing 404.
 * - Some setups may provide function key as query (e.g. `...?code=...`) and we should preserve it.
 */
export function buildAzureFunctionsUrl(base: string, endpoint: string): string {
  const rawBase = (base || "").trim() || "http://localhost:7071";
  const withProtocol = rawBase.includes("://") ? rawBase : `http://${rawBase}`;

  const baseUrl = new URL(withProtocol);
  baseUrl.hash = "";

  const out = new URL(baseUrl.origin);

  // Preserve base pathname when user configured it (e.g. https://<app>.azurewebsites.net/api)
  // but avoid duplicating it if endpoint already includes it.
  const basePath = (baseUrl.pathname || "/").replace(/\/+$/, "");
  const normalizedBasePath = basePath === "" || basePath === "/" ? "" : basePath;

  // endpoint에서 query string 분리 처리
  let epPath: string;
  let epQuery: string = "";
  
  if (endpoint.includes("?")) {
    const [pathPart, queryPart] = endpoint.split("?", 2);
    epPath = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
    epQuery = queryPart || "";
  } else {
    epPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }

  if (normalizedBasePath && (epPath === normalizedBasePath || epPath.startsWith(`${normalizedBasePath}/`))) {
    out.pathname = epPath;
  } else {
    out.pathname = `${normalizedBasePath}${epPath}` || "/";
  }

  // Preserve configured query params (e.g. Azure Functions key `code=...`)
  // and merge with endpoint query params
  const baseSearch = baseUrl.search ? baseUrl.search.substring(1) : "";
  const mergedSearch = [baseSearch, epQuery].filter(Boolean).join("&");
  if (mergedSearch) {
    out.search = `?${mergedSearch}`;
  }

  return out.toString();
}

