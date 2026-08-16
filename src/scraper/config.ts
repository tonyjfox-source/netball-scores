export interface ScraperConfig {
  targetUrl: string;
  scrapeIntervalMs: number;
  maxExecutionTimeMs: number;
  politeDelayMs: number;
  apiEndpoint: string;
}

export const config: ScraperConfig = {
  // Target Netball North Harbour URL
  targetUrl: 'https://www.netballnorthharbour.co.nz/draws-results/college-competition/college-saturday-1',
  
  // Scraper Loop execution interval (60 seconds)
  scrapeIntervalMs: 60 * 1000,
  
  // Graceful loop timeout limit (6 hours)
  maxExecutionTimeMs: 6 * 60 * 60 * 1000,
  
  // Polite sleep delay between sequential network calls (1000ms)
  politeDelayMs: 1000,
  
  // Sporty API draws & results POST endpoint
  apiEndpoint: 'https://www.netballnorthharbour.co.nz/api/v2/competition/widget/fixture/DatesNoCache'
};
