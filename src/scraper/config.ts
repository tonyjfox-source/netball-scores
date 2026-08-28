import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export interface ScraperConfig {
  targetUrl: string;
  scrapeIntervalMs: number;
  maxExecutionTimeMs: number;
  politeDelayMs: number;
  apiEndpoint: string;
}

const configPath = path.resolve(process.cwd(), 'config.yaml');

function loadConfig(): ScraperConfig {
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const parsed = YAML.parse(fileContent);
      if (parsed && parsed.scraper) {
        return {
          targetUrl: parsed.scraper.targetUrl || 'https://www.netballnorthharbour.co.nz/draws-results/club-competition/saturday-club-1',
          apiEndpoint: parsed.scraper.apiEndpoint || 'https://www.netballnorthharbour.co.nz/api/v2/competition/widget/fixture/DatesNoCache',
          scrapeIntervalMs: parsed.scraper.scrapeIntervalMs ?? 60 * 1000,
          maxExecutionTimeMs: parsed.scraper.maxExecutionTimeMs ?? 6 * 60 * 60 * 1000,
          politeDelayMs: parsed.scraper.politeDelayMs ?? 1000
        };
      }
    }
  } catch (err) {
    console.warn('Could not load config.yaml, falling back to default configuration:', err);
  }

  // Fallback defaults
  return {
    targetUrl: 'https://www.netballnorthharbour.co.nz/draws-results/club-competition/saturday-club-1',
    apiEndpoint: 'https://www.netballnorthharbour.co.nz/api/v2/competition/widget/fixture/DatesNoCache',
    scrapeIntervalMs: 60 * 1000,
    maxExecutionTimeMs: 6 * 60 * 60 * 1000,
    politeDelayMs: 1000
  };
}

export const config: ScraperConfig = loadConfig();
