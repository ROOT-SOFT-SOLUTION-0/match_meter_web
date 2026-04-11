import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, CardHeader, Loading } from '../components';
import { useAuth } from '../hooks';
import { useLiveMatchControl } from '../hooks/useLiveMatchControl';
import { AddLiveEventInput } from '../services/bracket.service';
import { MatchEvent, MatchEventType } from '../types/models';

const EVENT_OPTIONS: Array<{ value: MatchEventType; label: string }> = [
  { value: 'goal', label: 'Goal' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'yellow_card', label: 'Yellow Card' },
  { value: 'red_card', label: 'Red Card' },
  { value: 'substitution', label: 'Substitution' },
];

const eventNeedsTeam = (type: MatchEventType) => {
  return (
    type === 'goal' ||
    type === 'penalty' ||
    type === 'yellow_card' ||
    type === 'red_card' ||
    type === 'substitution'
  );
};

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  live: 'bg-red-100 text-red-700',
  break: 'bg-amber-100 text-amber-700',
  stopped: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  bye: 'bg-gray-100 text-gray-700',
};

const getEventDescription = (event: MatchEvent, team1Name?: string, team2Name?: string) => {
  const teamName =
    event.teamSide === 1
      ? team1Name || 'Team 1'
      : event.teamSide === 2
      ? team2Name || 'Team 2'
      : null;

  switch (event.type) {
    case 'match_started':
      return 'Match started';
    case 'goal':
      return `${teamName} goal${event.playerName ? ` by ${event.playerName}` : ''}`;
    case 'penalty':
      return `${teamName} penalty ${event.penaltyOutcome || ''}${
        event.playerName ? ` (${event.playerName})` : ''
      }`.trim();
    case 'yellow_card':
      return `${teamName} yellow card${event.playerName ? ` to ${event.playerName}` : ''}`;
    case 'red_card':
      return `${teamName} red card${event.playerName ? ` to ${event.playerName}` : ''}`;
    case 'substitution':
      return `${teamName} substitution${
        event.playerName || event.secondaryPlayerName
          ? ` (${event.playerName || 'Player out'} -> ${event.secondaryPlayerName || 'Player in'})`
          : ''
      }`;
    case 'break':
      return 'Match moved to break';
    case 'resume':
      return 'Match resumed';
    case 'match_stopped':
      return 'Match stopped';
    case 'score_adjusted':
      return event.note || 'Live score adjusted';
    case 'match_completed':
      return event.note || 'Final result confirmed';
    default:
      return event.note || 'Update';
  }
};

const LiveMatchControl: React.FC = () => {
  const navigate = useNavigate();
  const { id: tournamentId, matchId } = useParams<{ id: string; matchId: string }>();
  const { user } = useAuth();

  const {
    match,
    events,
    loading,
    actionLoading,
    error,
    liveScore,
    startMatch,
    setBreak,
    resumeMatch,
    stopMatch,
    addEvent,
    adjustScore,
    confirmFinalResult,
  } = useLiveMatchControl(matchId);

  const [controlMinute, setControlMinute] = useState(0);
  const [controlNote, setControlNote] = useState('');

  const [eventType, setEventType] = useState<MatchEventType>('goal');
  const [eventMinute, setEventMinute] = useState(0);
  const [eventTeam, setEventTeam] = useState<1 | 2>(1);
  const [playerName, setPlayerName] = useState('');
  const [secondaryPlayerName, setSecondaryPlayerName] = useState('');
  const [penaltyOutcome, setPenaltyOutcome] = useState<'scored' | 'missed'>('scored');
  const [eventNote, setEventNote] = useState('');

  const [manualTeam1Score, setManualTeam1Score] = useState(0);
  const [manualTeam2Score, setManualTeam2Score] = useState(0);

  useEffect(() => {
    setManualTeam1Score(liveScore.team1);
    setManualTeam2Score(liveScore.team2);
  }, [liveScore.team1, liveScore.team2]);

  const canConfirmFinalResult = useMemo(() => {
    if (!match) return false;
    return match.status === 'stopped' && liveScore.team1 !== liveScore.team2;
  }, [match, liveScore.team1, liveScore.team2]);

  const showDrawWarning = match?.status === 'stopped' && liveScore.team1 === liveScore.team2;

  if (!tournamentId || !matchId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardBody className="space-y-3">
            <p className="text-red-600 font-semibold">Invalid live match route.</p>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <Loading fullscreen message="Loading live match control..." />;
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardBody className="space-y-3">
            <p className="text-red-600 font-semibold">Match was not found.</p>
            <Button variant="secondary" onClick={() => navigate(`/tournament/${tournamentId}/bracket`)}>
              Back to Bracket
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const handleStart = async () => {
    try {
      await startMatch(user?.uid);
      toast.success('Match started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to start match');
    }
  };

  const handleBreak = async () => {
    try {
      await setBreak(controlMinute, controlNote.trim() || undefined, user?.uid);
      toast.success('Match moved to break');
      setControlNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to set break');
    }
  };

  const handleResume = async () => {
    try {
      await resumeMatch(controlMinute, controlNote.trim() || undefined, user?.uid);
      toast.success('Match resumed');
      setControlNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to resume match');
    }
  };

  const handleStop = async () => {
    try {
      await stopMatch(controlMinute, controlNote.trim() || undefined, user?.uid);
      toast.success('Match stopped');
      setControlNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to stop match');
    }
  };

  const handleAddEvent = async () => {
    const payload: AddLiveEventInput = {
      type: eventType,
      minute: eventMinute,
    };

    if (eventNeedsTeam(eventType)) {
      payload.teamSide = eventTeam;
    }

    if (playerName.trim()) {
      payload.playerName = playerName.trim();
    }

    if (secondaryPlayerName.trim()) {
      payload.secondaryPlayerName = secondaryPlayerName.trim();
    }

    if (eventType === 'penalty') {
      payload.penaltyOutcome = penaltyOutcome;
    }

    if (eventNote.trim()) {
      payload.note = eventNote.trim();
    }

    try {
      await addEvent(payload, user?.uid);
      toast.success('Live event added');
      setPlayerName('');
      setSecondaryPlayerName('');
      setEventNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to add event');
    }
  };

  const handleAdjustScore = async () => {
    try {
      await adjustScore(manualTeam1Score, manualTeam2Score, controlMinute, user?.uid);
      toast.success('Live score updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to adjust score');
    }
  };

  const handleConfirmResult = async () => {
    try {
      await confirmFinalResult(tournamentId);
      toast.success('Final result confirmed and bracket advanced');
      navigate(`/tournament/${tournamentId}/bracket`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to confirm result');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Live Match Control
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {match.team1Name || 'Team 1'} vs {match.team2Name || 'Team 2'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/tournament/${tournamentId}/bracket`)}>
          Back to Bracket
        </Button>
      </div>

      {(error || showDrawWarning) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error || 'Final confirmation requires a non-draw score.'}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Match Runtime" subtitle="Control status and scoring" />
          <CardBody className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  statusBadgeClass[match.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {match.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Minute: <strong>{match.currentMinute ?? 0}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between gap-4 text-center">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {match.team1Name || 'Team 1'}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {liveScore.team1} - {liveScore.team2}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate text-right">
                    {match.team2Name || 'Team 2'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Control minute</label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={controlMinute}
                  onChange={(e) => setControlMinute(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Control note (optional)</label>
                <input
                  type="text"
                  value={controlNote}
                  onChange={(e) => setControlNote(e.target.value)}
                  placeholder="e.g., Half-time break"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleStart}
                disabled={actionLoading || !(match.status === 'pending' || match.status === 'scheduled')}
              >
                Start Match
              </Button>
              <Button
                variant="outline"
                onClick={handleBreak}
                disabled={actionLoading || match.status !== 'live'}
              >
                Break
              </Button>
              <Button
                variant="outline"
                onClick={handleResume}
                disabled={actionLoading || match.status !== 'break'}
              >
                Resume
              </Button>
              <Button
                variant="danger"
                onClick={handleStop}
                disabled={actionLoading || !(match.status === 'live' || match.status === 'break')}
              >
                Stop Match
              </Button>
              <Button
                variant="secondary"
                onClick={handleConfirmResult}
                disabled={actionLoading || !canConfirmFinalResult}
              >
                Confirm Final Result
              </Button>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manual score adjustment</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {match.team1Name || 'Team 1'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualTeam1Score}
                    onChange={(e) => setManualTeam1Score(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {match.team2Name || 'Team 2'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualTeam2Score}
                    onChange={(e) => setManualTeam2Score(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={handleAdjustScore}
                    disabled={actionLoading || match.status === 'completed'}
                  >
                    Update Live Score
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Add Live Event" subtitle="Manual minute entry" />
          <CardBody className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Event type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as MatchEventType)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
              >
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Minute</label>
              <input
                type="number"
                min={0}
                max={300}
                value={eventMinute}
                onChange={(e) => setEventMinute(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
              />
            </div>

            {eventNeedsTeam(eventType) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Team</label>
                <select
                  value={eventTeam}
                  onChange={(e) => setEventTeam((parseInt(e.target.value, 10) || 1) as 1 | 2)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                >
                  <option value={1}>{match.team1Name || 'Team 1'}</option>
                  <option value={2}>{match.team2Name || 'Team 2'}</option>
                </select>
              </div>
            )}

            {eventType === 'penalty' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Penalty outcome</label>
                <select
                  value={penaltyOutcome}
                  onChange={(e) => setPenaltyOutcome(e.target.value as 'scored' | 'missed')}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                >
                  <option value="scored">Scored</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Player (optional)</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g., Rohit"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
              />
            </div>

            {eventType === 'substitution' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Player in (optional)</label>
                <input
                  type="text"
                  value={secondaryPlayerName}
                  onChange={(e) => setSecondaryPlayerName(e.target.value)}
                  placeholder="e.g., Kishore"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
                placeholder="Any extra context"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white"
              />
            </div>

            <Button
              fullWidth
              onClick={handleAddEvent}
              disabled={actionLoading || match.status !== 'live'}
            >
              Add Event
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Live Timeline" subtitle="Latest first" />
        <CardBody>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getEventDescription(event, match.team1Name, match.team2Name)}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{event.minute}'</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {new Date(event.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default LiveMatchControl;
