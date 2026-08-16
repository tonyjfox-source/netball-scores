import { SportyWidgetSettings } from '../parser/html-parser.js';
import { config } from './config.js';

/**
 * Generic fetch client with retry logic and exponential backoff.
 * Retries on network errors or 429/5xx HTTP responses.
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<Response> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[Fetcher] Retrying due to status ${response.status} (attempt ${attempt + 1}/${maxAttempts})`);
      } else {
        // Do not retry 4xx errors (e.g. 404, 403, 400)
        throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      if (attempt === maxAttempts - 1) {
        throw err;
      }
      console.warn(`[Fetcher] Request error: ${err.message}. Retrying (attempt ${attempt + 1}/${maxAttempts})`);
    }

    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    attempt++;
  }
  throw new Error(`Failed to fetch from ${url} after ${maxAttempts} attempts`);
}

/**
 * Fetches HTML from the target web URL using fetch with retry.
 */
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return response.text();
}

/**
 * Hits the Sporty JSON API to retrieve draws and fixtures dataset.
 */
export async function fetchFixtures(settings: SportyWidgetSettings): Promise<any> {
  const currentYear = new Date().getFullYear();
  const payload = {
    CompIds: [settings.compId],
    OrgIds: settings.orgIds,
    GradeIds: settings.gradeIds,
    From: `${currentYear - 1}-01-01T00:00:00`,
    To: `${currentYear + 1}-12-31T23:59:59`
  };

  const response = await fetchWithRetry(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
