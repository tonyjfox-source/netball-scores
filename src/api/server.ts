import express from 'express';
import cors from 'cors';
import { getEntities, getTeams, MatchFilters } from '../db/repository.js';
import { config } from '../scraper/config.js';
import { dbEvents } from '../db/events.js';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Configure Express to use CORS so local clients on other ports can access it
app.use(cors());
app.use(express.json());

// Serve built frontend assets in production if frontend/dist exists
import fs from 'fs';
import path from 'path';

const frontendBuildPath = path.resolve(process.cwd(), 'frontend/dist');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Helper function to map database entities to simplified JSON score format
function mapEntitiesToScores(entities: any[]) {
  const now = new Date();

  return entities.map((entity) => {
    let status: 'LIVE' | 'FINAL' | 'UPCOMING' = 'UPCOMING';

    const startDate = entity.dateFrom ? new Date(entity.dateFrom) : null;
    const endDate = entity.dateTo ? new Date(entity.dateTo) : (startDate ? new Date(startDate.getTime() + 90 * 60 * 1000) : null);
    const hasScores = entity.homeScore !== null && entity.awayScore !== null;
    const statusUpper = (entity.statusName || '').toUpperCase();

    // 1. Explicit Live status strings OR current time falls within start & end time window
    if (
      statusUpper.includes('LIVE') ||
      statusUpper.includes('IN PROGRESS') ||
      statusUpper.includes('PLAYING') ||
      (startDate && endDate && now >= startDate && now <= endDate)
    ) {
      status = 'LIVE';
    }
    // 2. Explicit Final status strings OR match end time has passed with recorded scores
    else if (
      statusUpper.includes('PLAYED') ||
      statusUpper.includes('FINAL') ||
      statusUpper.includes('RESULT') ||
      statusUpper.includes('COMPLETED') ||
      statusUpper.includes('FINISHED') ||
      (endDate && now > endDate && hasScores)
    ) {
      status = 'FINAL';
    }
    // 3. Upcoming if match start time has not been reached yet
    else if (startDate && now < startDate) {
      status = 'UPCOMING';
    }
    // Fallback: If has scores and match start time was in the past, treat as FINAL
    else if (hasScores && startDate && now > startDate) {
      status = 'FINAL';
    }

    return {
      id: entity.id.toString(),
      teamA: entity.homeTeamName,
      scoreA: entity.homeScore ?? 0,
      teamB: entity.awayTeamName,
      scoreB: entity.awayScore ?? 0,
      status,
      court: entity.venueName ?? '',
      dateFrom: entity.dateFrom
    };
  });
}

// GET /api/scores/stream endpoint for real-time Server-Sent Events (SSE) updates
app.get('/api/scores/stream', async (req, res) => {
  const team = typeof req.query.team === 'string' ? req.query.team : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  // Set SSE HTTP headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendScores = async () => {
    try {
      const filters: MatchFilters = {};
      if (team) filters.team = team;
      if (status) filters.status = status;

      const entities = await getEntities(filters);
      const scores = mapEntitiesToScores(entities);
      res.write(`data: ${JSON.stringify(scores)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE scores update:', error);
    }
  };

  // Send initial data immediately upon connection
  await sendScores();

  // Listen for instant database change events
  const onChange = () => {
    sendScores();
  };
  dbEvents.on('change', onChange);

  // Heartbeat interval (every 10 seconds) for time-based status shifts
  const intervalId = setInterval(sendScores, 10000);

  // Handle client connection cleanup
  req.on('close', () => {
    dbEvents.off('change', onChange);
    clearInterval(intervalId);
    res.end();
  });
});

// GET /api/scores endpoint that fetches filtered entities and maps them to a simplified JSON structure
app.get('/api/scores', async (req, res) => {
  try {
    const filters: MatchFilters = {};

    // Map and type-cast the query parameters
    if (typeof req.query.id === 'string') {
      filters.id = req.query.id;
    }

    if (typeof req.query.team === 'string') {
      filters.team = req.query.team;
    }

    if (typeof req.query.status === 'string') {
      const statusUpper = req.query.status.toUpperCase();
      if (statusUpper === 'FINAL' || statusUpper === 'LIVE' || statusUpper === 'UPCOMING') {
        filters.status = statusUpper;
      } else {
        filters.status = req.query.status;
      }
    }

    if (typeof req.query.limit === 'string') {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = parsedLimit;
      }
    }

    // Fetch the filtered entities from the database layer
    const entities = await getEntities(filters);
    const mappedScores = mapEntitiesToScores(entities);

    res.json(mappedScores);
  } catch (error: any) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/teams endpoint that returns favourite teams and all unique team names
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await getTeams();
    res.json({
      favouriteTeams: config.favouriteTeams || [],
      teams: teams
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server listening on 0.0.0.0:3000
app.listen(PORT, HOST, () => {
  console.log(`Server is running and listening on http://${HOST}:${PORT}`);
  console.log(`API endpoint available at http://${HOST}:${PORT}/api/scores`);
});
