import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculateRoundResult, calculateTripStandings, ROUND_POINT_TOTALS } from '../points'
import {
  pairLabel,
  playerName,
  players,
  randomTeamAssignments,
  sameTeamAssignments,
  teamDayLabels,
  type PlayerId,
  type Round,
  type TeamAssignments,
} from '../data/trip'
import { scorecardsByRoundId } from '../data/scorecards'
import {
  courseHandicap,
  emptyClosestToPinForCard,
  emptyScoresForCard,
  fetchScores,
  formatPoints,
  formatToPar,
  getsStroke,
  netScore,
  patchClosestToPin,
  patchRoundSettings,
  patchRoundScores,
  patchTeamAssignments,
  playerIds,
  scorecardForRound,
  sumDefined,
  toPar,
  type ClosestToPinScores,
  type RoundHandicaps,
  type RoundHandicapsById,
  type HoleScore,
  type RoundScores,
  type TeeSelections,
} from '../scoring'

const POLL_MS = 2000

type Props = {
  rounds: Round[]
  teamAssignments: TeamAssignments
  onTeamAssignmentsChange: (assignments: TeamAssignments) => void
}

function displayScore(value: number | null) {
  return value == null ? '—' : formatToPar(value)
}

export function LiveScoring({ rounds, teamAssignments, onTeamAssignmentsChange }: Props) {
  const roundOptions = rounds.filter((round) => scorecardsByRoundId[round.id])
  const [roundId, setRoundId] = useState(roundOptions[0]?.id ?? 'trails')
  const [scores, setScores] = useState<RoundScores>({})
  const [closestToPin, setClosestToPin] = useState<ClosestToPinScores>({})
  const [teeSelections, setTeeSelections] = useState<TeeSelections>({})
  const [handicapsByRound, setHandicapsByRound] = useState<RoundHandicapsById>({})
  const [handicapDrafts, setHandicapDrafts] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'gross' | 'net'>('net')
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [teamsBusy, setTeamsBusy] = useState(false)
  const saving = useRef(false)
  const settingsSaving = useRef(false)
  const teamsSaving = useRef(false)
  const baseCard = scorecardsByRoundId[roundId]
  const card = scorecardForRound(roundId, teeSelections[roundId])
  const activeRound = rounds.find((round) => round.id === roundId)
  const roundHandicaps: RoundHandicaps = handicapsByRound[roundId] ?? {}
  const handicapForPlayer = (id: PlayerId) => roundHandicaps[id] ?? players.find((player) => player.id === id)!.handicap

  const refresh = useCallback(async () => {
    try {
      const store = await fetchScores()
      if (!saving.current) {
        setScores(store.scores ?? {})
        setClosestToPin(store.closestToPin ?? {})
        setUpdatedAt(store.updatedAt)
      }
      if (!settingsSaving.current) {
        setTeeSelections(store.tees ?? {})
        setHandicapsByRound(store.handicaps ?? {})
      }
      if (!teamsSaving.current && store.teamAssignments && !sameTeamAssignments(store.teamAssignments, teamAssignments)) {
        onTeamAssignmentsChange(store.teamAssignments)
      }
      setStatus('live')
    } catch {
      setStatus('error')
    }
  }, [onTeamAssignmentsChange, teamAssignments])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const id = window.setInterval(() => void refresh(), POLL_MS)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(id)
    }
  }, [refresh])

  const roundScores = useMemo(() => card ? scores[roundId] ?? emptyScoresForCard(card) : null, [scores, roundId, card])
  const roundCtp = useMemo(() => card ? closestToPin[roundId] ?? emptyClosestToPinForCard(card) : [], [closestToPin, roundId, card])
  const standings = useMemo(() => calculateTripStandings(scores, closestToPin, rounds, teeSelections, handicapsByRound), [scores, closestToPin, rounds, teeSelections, handicapsByRound])
  const roundResult = useMemo(() => activeRound ? calculateRoundResult(activeRound, scores, teeSelections, handicapsByRound) : null, [activeRound, scores, teeSelections, handicapsByRound])

  async function persistRound(nextRound: Record<PlayerId, HoleScore[]>) {
    saving.current = true
    setScores((prev) => ({ ...prev, [roundId]: nextRound }))
    try {
      const store = await patchRoundScores(roundId, nextRound)
      setScores(store.scores)
      setClosestToPin(store.closestToPin ?? {})
      setUpdatedAt(store.updatedAt)
      setStatus('live')
    } catch {
      setStatus('error')
    } finally {
      window.setTimeout(() => { saving.current = false }, 400)
    }
  }

  async function persistCtp(holeIndex: number, winner: PlayerId | null) {
    if (!card) return
    const next = [...roundCtp]
    next[holeIndex] = winner
    saving.current = true
    setClosestToPin((previous) => ({ ...previous, [roundId]: next }))
    try {
      const store = await patchClosestToPin(roundId, next)
      setClosestToPin(store.closestToPin ?? {})
      setUpdatedAt(store.updatedAt)
      setStatus('live')
    } catch {
      setStatus('error')
    } finally {
      window.setTimeout(() => { saving.current = false }, 400)
    }
  }

  async function persistRoundSettings(next: { teeId?: string; handicaps?: RoundHandicaps }) {
    settingsSaving.current = true
    if (next.teeId !== undefined) setTeeSelections((current) => ({ ...current, [roundId]: next.teeId! }))
    if (next.handicaps !== undefined) setHandicapsByRound((current) => ({ ...current, [roundId]: next.handicaps! }))
    try {
      const store = await patchRoundSettings(roundId, next)
      setTeeSelections(store.tees ?? {})
      setHandicapsByRound(store.handicaps ?? {})
      setUpdatedAt(store.updatedAt)
      setStatus('live')
    } catch {
      setStatus('error')
    } finally {
      settingsSaving.current = false
    }
  }

  async function shuffleTeams() {
    const next = randomTeamAssignments()
    teamsSaving.current = true
    setTeamsBusy(true)
    onTeamAssignmentsChange(next)
    try {
      const store = await patchTeamAssignments(next)
      if (store.teamAssignments) onTeamAssignmentsChange(store.teamAssignments)
      setUpdatedAt(store.updatedAt)
      setStatus('live')
    } catch {
      setStatus('error')
    } finally {
      teamsSaving.current = false
      setTeamsBusy(false)
    }
  }

  function setHoleScore(playerId: PlayerId, holeIndex: number, value: string) {
    if (!card || !roundScores) return
    const parsed: HoleScore = value === '' ? null : Math.max(1, Math.min(15, Number.parseInt(value, 10) || 0))
    const playerRow = [...roundScores[playerId]]
    playerRow[holeIndex] = parsed
    void persistRound({ ...roundScores, [playerId]: playerRow })
  }

  function clearRound() {
    if (!card || !confirm(`Clear shared scores for ${card.name}?`)) return
    void persistRound(emptyScoresForCard(card))
  }

  if (!card || !roundScores || !activeRound) return null
  const ids = playerIds()
  const ranked = [...ids].sort((a, b) => standings.byPlayer[b].total - standings.byPlayer[a].total)

  return (
    <div className="scoring">
      <div className="standings">
        <div className="standings__head">
          <h3>Trip standings</h3>
          <p className={`scoring__sync scoring__sync--${status}`}>
            {status === 'live' && 'Shared · live'}
            {status === 'connecting' && 'Connecting…'}
            {status === 'error' && 'Server offline — start npm run dev'}
            {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <ol className="standings__list">
          {ranked.map((id, i) => {
            const row = standings.byPlayer[id]
            return (
              <li key={id}>
                <span className="standings__rank">{i + 1}</span>
                <span className="standings__name">{row.name}</span>
                <span className="standings__breakdown">
                  rounds {formatPoints(row.round)} · side {formatPoints(row.side)} · {row.stableford} Stb
                </span>
                <span className="standings__total">{formatPoints(row.total)}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="sidegames">
        <h3>Trip side games</h3>
        <div className="sidegames__grid">
          <SideGame title="Net Stableford" prize="5 · 2 · 1" rows={ids.map((id) => [playerName(id), standings.byPlayer[id].stableford])} />
          <SideGame title="Best net round" prize="2 pts" rows={ids.map((id) => [playerName(id), displayScore(standings.byPlayer[id].bestNetRound)])} />
          <SideGame title="Gross birdies" prize="2 pts" rows={ids.map((id) => [playerName(id), standings.byPlayer[id].grossBirdies])} />
          <SideGame title="Eagles" prize="5 each" rows={ids.map((id) => [playerName(id), standings.byPlayer[id].eagles])} />
          <SideGame title="Hole in one" prize="10 full · 5 short" rows={ids.map((id) => [playerName(id), standings.byPlayer[id].holesInOne])} />
          <SideGame title="Closest to the pin" prize="1 pt" rows={ids.map((id) => [playerName(id), standings.byPlayer[id].closestToPin])} />
        </div>
        <p className="sidegames__note">Stableford: net bogey 1 · par 2 · birdie 3 · eagle 4; double bogey or worse 0. Net round is measured to par and counts once a player completes a card. Tied side-game prizes split evenly.</p>
      </div>

      <div className="teams-panel">
        <div className="teams-panel__head">
          <div>
            <h3>Team draw · Player slots 1–4</h3>
            <p>First three days rotate all partner combinations. Singles opponents cover each unique pairing once.</p>
          </div>
          <button type="button" className="teams-panel__shuffle" disabled={teamsBusy} onClick={() => void shuffleTeams()}>
            Shuffle slots + teams
          </button>
        </div>
        <div className="teams-panel__grid">
          {teamDayLabels.map((day) => {
            const teams = teamAssignments[day.key]
            return <div key={day.key} className="teams-panel__day"><span>{day.label}</span><b>A · {pairLabel(teams[0])}</b><b>B · {pairLabel(teams[1])}</b></div>
          })}
          <div className="teams-panel__day"><span>Nov 18 · Sheep Ranch</span><b>Final round · individual St. James Roll</b><small>No team partner</small></div>
        </div>
      </div>

      <div className="scoring__controls">
        <label className="scoring__field">
          <span>Round</span>
          <select value={roundId} onChange={(e) => setRoundId(e.target.value)}>
            {roundOptions.map((round) => <option key={round.id} value={round.id}>{round.course} · {round.dateLabel}</option>)}
          </select>
        </label>
        <div className="scoring__toggle" role="group" aria-label="Score display">
          <button type="button" className={mode === 'net' ? 'is-active' : ''} onClick={() => setMode('net')}>Net</button>
          <button type="button" className={mode === 'gross' ? 'is-active' : ''} onClick={() => setMode('gross')}>Gross</button>
        </div>
        <button type="button" className="scoring__clear" onClick={clearRound}>Clear round</button>
      </div>

      <p className="scoring__meta">
        {card.name} · {card.tee} tees · Par {card.par} · {card.holes} holes{card.rating != null ? ` · ${card.rating}/${card.slope}` : ''}
      </p>
      <p className="scoring__hint">
        Enter the tees and GHIN indexes for this round. Net scoring updates from course rating, slope, and each hole’s stroke index.
      </p>

      <div className="round-settings">
        <label className="scoring__field">
          <span>Tee for this round</span>
          <select
            value={teeSelections[roundId] ?? baseCard?.teeOptions.find((tee) => tee.name === baseCard.tee)?.id ?? ''}
            onChange={(event) => void persistRoundSettings({ teeId: event.target.value })}
          >
            {baseCard?.teeOptions.map((tee) => <option key={tee.id} value={tee.id}>{tee.name} · {tee.rating}/{tee.slope}</option>)}
          </select>
        </label>
        <div className="round-settings__handicaps">
          {players.map((player) => (
            <label key={player.id} className="scoring__field">
              <span>{player.name} · GHIN</span>
              <input
                type="number"
                inputMode="decimal"
                min="-10"
                max="54"
                step="0.1"
                value={handicapDrafts[`${roundId}:${player.id}`] ?? String(handicapForPlayer(player.id))}
                onChange={(event) => {
                  setHandicapDrafts((current) => ({ ...current, [`${roundId}:${player.id}`]: event.target.value }))
                }}
                onBlur={() => {
                  const key = `${roundId}:${player.id}`
                  const draft = handicapDrafts[key]
                  if (draft !== undefined) {
                    const value = Number(draft)
                    if (draft.trim() && Number.isFinite(value)) {
                      void persistRoundSettings({ handicaps: { ...roundHandicaps, [player.id]: value } })
                    }
                    setHandicapDrafts((current) => {
                      const next = { ...current }
                      delete next[key]
                      return next
                    })
                  }
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="scoring__table-wrap">
        <table className="scoring__table">
          <thead>
            <tr>
              <th scope="col">Hole</th>
              {card.holesDetail.map((hole) => <th key={hole.number} scope="col">{hole.number}</th>)}
              <th scope="col">Tot</th>
              <th scope="col">+/−</th>
            </tr>
            <tr className="scoring__par-row">
              <th scope="row">Par</th>
              {card.holesDetail.map((hole) => <td key={hole.number}>{hole.par}</td>)}
              <td>{card.par}</td><td />
            </tr>
            <tr className="scoring__si-row">
              <th scope="row">HCP</th>
              {card.holesDetail.map((hole) => <td key={hole.number}>{hole.strokeIndex}</td>)}
              <td /><td />
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const row = roundScores[id]
              const grossTotal = sumDefined(row)
              const playerHandicap = handicapForPlayer(id)
              const netValues = card.holesDetail.map((hole, index) => netScore(id, hole, row[index], card, playerHandicap))
              const netTotal = sumDefined(netValues)
              const displayTotal = mode === 'net' ? netTotal : grossTotal
              const displayToPar = toPar(displayTotal, card.holesDetail, mode === 'net' ? netValues : row)
              return (
                <tr key={id}>
                  <th scope="row">
                    <span className="scoring__player">{playerName(id)}</span>
                    <span className="scoring__strokes">GHIN {playerHandicap.toFixed(1)} · CH {courseHandicap(id, card, playerHandicap)}</span>
                  </th>
                  {card.holesDetail.map((hole, index) => (
                    <td key={hole.number} className="scoring__cell">
                      <label className="scoring__input-wrap">
                        <span className="visually-hidden">{playerName(id)} hole {hole.number}</span>
                        <input inputMode="numeric" pattern="[0-9]*" maxLength={2} value={row[index] ?? ''} onChange={(event) => setHoleScore(id, index, event.target.value)} />
                        {getsStroke(id, hole, card, playerHandicap) ? <span className="scoring__dot" title="Course-handicap stroke" /> : null}
                        {mode === 'net' && row[index] != null ? <span className="scoring__net-mini">{netValues[index]}</span> : null}
                      </label>
                    </td>
                  ))}
                  <td className="scoring__total">{displayTotal ?? '—'}</td>
                  <td className="scoring__total">{formatToPar(displayToPar)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(roundId === 'preserve' || roundId === 'shortys') && (
        <div className="ctp-panel">
          <div className="round-points__head"><h3>Closest to the pin · {card.name}</h3><p>Mark one winner for each par-3 hole. Most across both short courses earns one trip point.</p></div>
          <div className="ctp-panel__grid">
            {card.holesDetail.map((hole, index) => hole.par !== 3 ? null : (
              <label key={hole.number} className="scoring__field"><span>Hole {hole.number}</span><select value={roundCtp[index] ?? ''} onChange={(event) => void persistCtp(index, event.target.value ? event.target.value as PlayerId : null)}><option value="">Not marked</option>{ids.map((id) => <option key={id} value={id}>{playerName(id)}</option>)}</select></label>
            ))}
          </div>
        </div>
      )}

      {roundResult && (
        <div className="round-points">
          <div className="round-points__head">
            <h3>{roundResult.course} · {roundResult.format}</h3>
            <p>Round points · {ROUND_POINT_TOTALS[activeRound.game.formatId]} available</p>
            <p>{ids.map((id) => `${playerName(id)} ${formatPoints(roundResult.points[id])}`).join(' · ')}</p>
          </div>
          {roundResult.events.length ? (
            <ul className="round-points__events">{roundResult.events.map((event, index) => (
              <li key={`${event.label}-${index}`}>
                <span className="round-points__label">{event.label}</span>
                <span className="round-points__detail">{event.detail}</span>
                <span className="round-points__pts">{Object.entries(event.points).filter(([, value]) => value && value > 0).map(([id, value]) => `${playerName(id as PlayerId)} +${formatPoints(value!)}`).join(' · ')}</span>
              </li>
            ))}</ul>
          ) : <p className="scoring__hint">Enter scores to calculate this round’s game points.</p>}
        </div>
      )}

      <p className="scoring__source">Scorecard source: {card.source}</p>
    </div>
  )
}

function SideGame({ title, prize, rows }: { title: string; prize: string; rows: [string, number | string][] }) {
  return <section className="sidegame"><div className="sidegame__head"><h4>{title}</h4><span>{prize}</span></div><ul>{rows.map(([name, value]) => <li key={name}><span>{name}</span><b>{value}</b></li>)}</ul></section>
}
