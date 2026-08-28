import { config, ScheduleConfig } from './config.js';
import { processUrl } from './pipeline.js';

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

/**
 * Parses time strings into minutes past midnight (0 - 1439).
 * Supports formats: "8am", "8:30am", "1pm", "1:00pm", "08:00", "13:00", "8".
 */
export function parseTimeToMinutes(timeStr: string): number {
  const normalized = timeStr.trim().toLowerCase();

  // Match 12-hour format: e.g. "8am", "8:30am", "1pm", "1:00pm"
  const twelveHourMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
    const period = twelveHourMatch[3];

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Match 24-hour format: e.g. "08:00", "13:00"
  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1], 10);
    const minutes = parseInt(twentyFourHourMatch[2], 10);
    return hours * 60 + minutes;
  }

  // Pure integer format: e.g. "8", "13"
  const plainHour = parseInt(normalized, 10);
  if (!isNaN(plainHour)) {
    return plainHour * 60;
  }

  throw new Error(`Invalid time format in schedule config: "${timeStr}"`);
}

/**
 * Parses day of week string into JS Date day number (0 = Sunday, 6 = Saturday).
 */
export function parseDayOfWeek(dayStr: string): number {
  const normalized = dayStr.trim().toLowerCase();
  if (normalized in DAYS_MAP) {
    return DAYS_MAP[normalized];
  }
  const dayNum = parseInt(normalized, 10);
  if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
    return dayNum;
  }
  throw new Error(`Invalid dayOfWeek in schedule config: "${dayStr}"`);
}

/**
 * Checks whether the given date/time falls within the scheduled window.
 */
export function isWithinSchedule(now: Date, schedule: ScheduleConfig): boolean {
  const targetDay = parseDayOfWeek(schedule.dayOfWeek);
  const currentDay = now.getDay();

  if (currentDay !== targetDay) {
    return false;
  }

  const startMinutes = parseTimeToMinutes(schedule.startTime);
  const endMinutes = parseTimeToMinutes(schedule.endTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

let isScrapeRunning = false;

/**
 * Executes a single scheduled tick.
 */
export async function tickScheduler(): Promise<void> {
  const now = new Date();
  const timestamp = now.toLocaleString();
  const schedule = config.schedule;

  if (isWithinSchedule(now, schedule)) {
    if (isScrapeRunning) {
      console.log(`[${timestamp}] [Scheduler] Previous scrape is still running. Skipping tick.`);
      return;
    }

    console.log(`[${timestamp}] [Scheduler] Active window matched (${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}). Triggering scraper...`);
    isScrapeRunning = true;
    try {
      const fixtures = await processUrl(config.targetUrl);
      console.log(`[${new Date().toLocaleString()}] [Scheduler] Scrape completed successfully. Processed ${fixtures.length} fixtures.`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString()}] [Scheduler] Error during scheduled scrape:`, err);
    } finally {
      isScrapeRunning = false;
    }
  } else {
    console.log(`[${timestamp}] [Scheduler] Outside scheduled window (${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}). Standing by.`);
  }
}

/**
 * Starts the continuous scheduler process based on config.yaml.
 */
export function startScheduler(): void {
  const { schedule, targetUrl } = config;
  console.log('====================================================');
  console.log('Netball Score Tracker Scraper Scheduler Started');
  console.log('====================================================');
  console.log(`Target URL:       ${targetUrl}`);
  console.log(`Scheduled Day:    ${schedule.dayOfWeek}`);
  console.log(`Time Window:      ${schedule.startTime} - ${schedule.endTime}`);
  console.log(`Check Interval:   ${schedule.interval} seconds`);
  console.log('====================================================\n');

  // Run initial tick immediately
  tickScheduler();

  // Schedule recurring execution
  const intervalMs = schedule.interval * 1000;
  setInterval(tickScheduler, intervalMs);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('scheduler.ts') || process.argv[1]?.endsWith('scheduler.js')) {
  startScheduler();
}
