import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export interface ScheduleConfig {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  interval: number; // Interval in seconds
}

export interface ScraperConfig {
  targetUrl: string;
  scrapeIntervalMs: number;
  maxExecutionTimeMs: number;
  politeDelayMs: number;
  apiEndpoint: string;
  schedule: ScheduleConfig;
}

const configPath = path.resolve(process.cwd(), 'config.yaml');

function loadConfig(): ScraperConfig {
  const defaultSchedule: ScheduleConfig = {
    dayOfWeek: 'Saturday',
    startTime: '8am',
    endTime: '1pm',
    interval: 60
  };

  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const parsed = YAML.parse(fileContent);
      if (parsed) {
        const scraperSection = parsed.scraper || {};
        const scheduleSection = parsed.schedule || {};

        return {
          targetUrl: scraperSection.targetUrl || 'https://www.netballnorthharbour.co.nz/draws-results/club-competition/saturday-club-1',
          apiEndpoint: scraperSection.apiEndpoint || 'https://www.netballnorthharbour.co.nz/api/v2/competition/widget/fixture/DatesNoCache',
          scrapeIntervalMs: (scheduleSection.interval ? scheduleSection.interval * 1000 : undefined) ?? scraperSection.scrapeIntervalMs ?? 60 * 1000,
          maxExecutionTimeMs: scraperSection.maxExecutionTimeMs ?? 6 * 60 * 60 * 1000,
          politeDelayMs: scraperSection.politeDelayMs ?? 1000,
          schedule: {
            dayOfWeek: scheduleSection.dayOfWeek || defaultSchedule.dayOfWeek,
            startTime: scheduleSection.startTime || defaultSchedule.startTime,
            endTime: scheduleSection.endTime || defaultSchedule.endTime,
            interval: scheduleSection.interval ?? defaultSchedule.interval
          }
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
    politeDelayMs: 1000,
    schedule: defaultSchedule
  };
}

export const config: ScraperConfig = loadConfig();
