import React, { useState, useEffect, useMemo } from 'react';

export interface Score {
  id: string;
  teamA: string;
  scoreA: number;
  teamB: string;
  scoreB: number;
  status: 'LIVE' | 'FINAL' | 'UPCOMING';
  quarter?: string;
  timeRemaining?: string;
  court: string;
  dateFrom?: string;
}

export interface ScraperStatus {
  isEnabled: boolean;
  isScrapeRunning: boolean;
  activeWindow: boolean;
  lastScrapeTime: string | null;
  lastScrapeCount: number;
}

export default function ScoreDashboard() {
  const [favouriteTeams, setFavouriteTeams] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [latestOnly, setLatestOnly] = useState<boolean>(true);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [loadingScores, setLoadingScores] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [triggeringScrape, setTriggeringScrape] = useState<boolean>(false);

  // Hook 0: Fetch Scraper Status
  useEffect(() => {
    fetch('/api/scraper/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setScraperStatus(data))
      .catch(() => {});
  }, []);

  const handleToggleScraper = async () => {
    try {
      const res = await fetch('/api/scraper/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScraperStatus(data.status);
      }
    } catch (err) {
      console.error('Error toggling scraper:', err);
    }
  };

  const handleTriggerScrape = async () => {
    setTriggeringScrape(true);
    try {
      const res = await fetch('/api/scraper/trigger', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScraperStatus(data.status);
      }
    } catch (err) {
      console.error('Error triggering scrape:', err);
    } finally {
      setTriggeringScrape(false);
    }
  };

  // Hook 1: Fetch all teams on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingTeams(true);
    setError(null);

    fetch('/api/teams')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch teams (${res.status} ${res.statusText})`);
        }
        return res.json();
      })
      .then((data: any) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            setTeams(data);
          } else {
            setFavouriteTeams(data.favouriteTeams || []);
            setTeams(data.teams || []);
          }
          setLoadingTeams(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          console.error('Error fetching teams:', err);
          setError(err.message);
          setLoadingTeams(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Hook 2: Connect SSE Stream whenever selectedTeam changes
  useEffect(() => {
    if (!selectedTeam) {
      setScores([]);
      setLoadingScores(false);
      return;
    }

    setLoadingScores(true);
    setError(null);

    const eventSource = new EventSource('/api/scores/stream?team=' + encodeURIComponent(selectedTeam));

    eventSource.onmessage = (event) => {
      try {
        const data: Score[] = JSON.parse(event.data);
        setScores(data);
        setLoadingScores(false);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [selectedTeam]);

  // Compute displayed scores based on latestOnly filter
  const displayedScores = useMemo(() => {
    if (!latestOnly || scores.length === 0) {
      return scores;
    }

    // If any game is in progress ('LIVE'), return those LIVE games
    const liveGames = scores.filter((s) => s.status === 'LIVE');
    if (liveGames.length > 0) {
      return liveGames;
    }

    // Otherwise, return the most recent game based on date and time
    const sorted = [...scores].sort((a, b) => {
      if (!a.dateFrom || !b.dateFrom) return 0;
      return new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime();
    });

    return [sorted[0]];
  }, [scores, latestOnly]);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTeam(val ? val : null);
  };

  const getStatusBadge = (status: Score['status']) => {
    switch (status) {
      case 'LIVE':
        return <span className="status-badge status-live">🔴 LIVE</span>;
      case 'FINAL':
        return <span className="status-badge status-final">🏁 FINAL</span>;
      case 'UPCOMING':
        return <span className="status-badge status-upcoming">⏳ UPCOMING</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const formatTimeOnly = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-icon">🏐</span>
          <h1>Netball North Harbour</h1>
        </div>
        {scraperStatus && (
          <div className="scraper-controls">
            <button
              className={`scraper-toggle-btn ${scraperStatus.isEnabled ? 'active' : 'paused'}`}
              onClick={handleToggleScraper}
              title={scraperStatus.isEnabled ? 'Pause Scraper Scheduler' : 'Enable Scraper Scheduler'}
            >
              {scraperStatus.isEnabled ? '🟢 Scraper Active' : '⏸️ Scraper Paused'}
            </button>
            <button
              className="scraper-trigger-btn"
              onClick={handleTriggerScrape}
              disabled={triggeringScrape || scraperStatus.isScrapeRunning}
            >
              {triggeringScrape || scraperStatus.isScrapeRunning ? '🔄 Syncing...' : '⚡ Sync Now'}
            </button>
          </div>
        )}
      </header>

      <main className="dashboard-main">
        {/* Controls Section */}
        <section className="control-section">
          <div className="controls-row">
            <div className="select-group">
              <label htmlFor="team-select" className="select-label">
                Filter by Team:
              </label>
              <div className="select-wrapper">
                <select
                  id="team-select"
                  className="team-select"
                  value={selectedTeam || ''}
                  onChange={handleTeamChange}
                  disabled={loadingTeams}
                >
                  <option value="">- Choose a Team -</option>
                  {favouriteTeams.length > 0 && (
                    <optgroup label="⭐ Favourite Teams">
                      {favouriteTeams.map((t) => (
                        <option key={`fav-${t}`} value={t}>
                          ⭐ {t}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Teams">
                    {teams.map((t) => (
                      <option key={`all-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="select-arrow">▼</span>
              </div>
            </div>

            <div className="checkbox-group">
              <label htmlFor="latest-only-checkbox" className="checkbox-label">
                <input
                  type="checkbox"
                  id="latest-only-checkbox"
                  className="custom-checkbox"
                  checked={latestOnly}
                  onChange={(e) => setLatestOnly(e.target.checked)}
                />
                <span className="checkbox-text">Show latest game only</span>
              </label>
            </div>
          </div>

          {loadingTeams && <span className="loading-spinner">Loading teams...</span>}
        </section>

        {/* Error Notification */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Results Section */}
        <section className="scores-section">
          {!selectedTeam && !loadingTeams && (
            <div className="empty-state">
              <span className="empty-icon">👆</span>
              <h3>No Team Selected</h3>
              <p>Please select a team from the dropdown above to view their match scores.</p>
            </div>
          )}

          {selectedTeam && loadingScores && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Connecting live stream for <strong>{selectedTeam}</strong>...</p>
            </div>
          )}

          {selectedTeam && !loadingScores && displayedScores.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No Matches Found</h3>
              <p>No recorded matches found for <strong>{selectedTeam}</strong>.</p>
            </div>
          )}

          {selectedTeam && !loadingScores && displayedScores.length > 0 && (
            <div className="scores-grid">
              {displayedScores.map((match) => {
                const isTeamASelected = match.teamA.toLowerCase().includes(selectedTeam.toLowerCase());
                const isTeamBSelected = match.teamB.toLowerCase().includes(selectedTeam.toLowerCase());
                const formattedDate = formatDate(match.dateFrom);
                const scheduledTime = formatTimeOnly(match.dateFrom);

                return (
                  <article key={match.id} className="score-card">
                    <div className="card-header">
                      {getStatusBadge(match.status)}
                      <span className="court-info">{match.court || 'Court Unallocated'}</span>
                    </div>

                    {formattedDate && (
                      <div className="date-info">
                        <span className="calendar-icon">📅</span> {formattedDate}
                      </div>
                    )}

                    <div className="teams-scores-wrapper">
                      {/* Team A */}
                      <div className={`team-row ${isTeamASelected ? 'highlight-team' : ''}`}>
                        <span className="team-name">{match.teamA}</span>
                        <span className={`team-score ${match.status === 'FINAL' && match.scoreA > match.scoreB ? 'winner' : ''}`}>
                          {match.status === 'UPCOMING' && match.scoreA === 0 ? '-' : match.scoreA}
                        </span>
                      </div>

                      <div className="versus-divider">VS</div>

                      {/* Team B */}
                      <div className={`team-row ${isTeamBSelected ? 'highlight-team' : ''}`}>
                        <span className="team-name">{match.teamB}</span>
                        <span className={`team-score ${match.status === 'FINAL' && match.scoreB > match.scoreA ? 'winner' : ''}`}>
                          {match.status === 'UPCOMING' && match.scoreB === 0 ? '-' : match.scoreB}
                        </span>
                      </div>
                    </div>

                    {match.status === 'LIVE' && (match.quarter || match.timeRemaining) && (
                      <div className="card-footer">
                        {match.quarter && <span className="match-detail">Quarter: {match.quarter}</span>}
                        {match.timeRemaining && <span className="match-detail">Time: {match.timeRemaining}</span>}
                      </div>
                    )}

                    {match.status === 'UPCOMING' && scheduledTime && (
                      <div className="card-footer">
                        <span className="match-detail">Start Time: {scheduledTime}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
