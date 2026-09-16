import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { schedule } from '../data/trip'
import { scorecardsByRoundId } from '../data/scorecards'
import { calculateRoundResult, calculateTripStandings } from '../points'
import {
  emptyScoresForCard,
  fetchScores,
  formatPoints,
  formatToPar,
  getsStroke,
  netScore,
  patchRoundScores,
  playerIds,
  sumDefined,
  toPar,
  type HoleScore,
  type RoundScores,
} from '../scoring'
import { playerName, strokesOffLow, type PlayerId } from '../data/trip'

const POLL_MS = 2000

export function LiveScoring() {
  const roundOptions = schedule.filter((r) => scorecardsByRoundId[r.id])
  const [roundId, setRoundId] = useState(roundOptions[0]?.id ?? 'trails')
  const [scores, setScores] = useState<RoundScores>({})
  const [mode, setMode] = useState<'gross' | 'net'>('net')
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const saving = useRef(false)
  const card = scorecardsByRoundId[roundId]

  const refresh = useCallback(async () => {
    try {
      const store = await fetchScores()
      if (!saving.current) {
        setScores(store.scores ?? {})
        setUpdatedAt(store.updatedAt)
      }
      setStatus('live')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  const roundScores = useMemo(() => {
    if (!card) return null
    return scores[roundId] ?? emptyScoresForCard(card)
  }, [scores, roundId, card])

  const standings = useMemo(() => calculateTripStandings(scores), [scores])
  const roundResult = useMemo(() => {
    const round = schedule.find((r) => r.id === roundId)
    if (!round) return null
    return calculateRoundResult(round, scores)
  }, [roundId, scores])

  async function persistRound(nextRound: Record<PlayerId, HoleScore[]>) {
    saving.current = true
    setScores((prev) => ({ ...prev, [roundId]: nextRound }))
    try {
      const store = await patchRoundScores(roundId, nextRound)
      setScores(store.scores)
      setUpdatedAt(store.updatedAt)
      setStatus('live')
    } catch {
      setStatus('error')
    } finally {
      // brief lock so poll doesn't clobber optimistic UI mid-keystroke
      window.setTimeout(() => {
        saving.current = false
      }, 400)
    }
  }

  function setHoleScore(playerId: PlayerId, holeIndex: number, value: string) {
    if (!card || !roundScores) return
    const parsed: HoleScore =
      value === '' ? null : Math.max(1, Math.min(15, Number.parseInt(value, 10) || 0))
    const playerRow = [...roundScores[playerId]]
    playerRow[holeIndex] = parsed === 0 ? null : parsed
    void persistRound({ ...roundScores, [playerId]: playerRow })
  }

  function clearRound() {
    if (!card || !confirm(`Clear shared scores for ${card.name}?`)) return
    void persistRound(emptyScoresForCard(card))
  }

  if (!card || !roundScores) return null
  const ids = playerIds()
  const ranked = [...ids].sort(
    (a, b) => standings.byPlayer[b].total - standings.byPlayer[a].total,
  )

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
                  match {formatPoints(row.match)} · skins {formatPoints(row.skins)}
                </span>
                <span className="standings__total">{formatPoints(row.total)}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="scoring__controls">
        <label className="scoring__field">
          <span>Round</span>
          <select value={roundId} onChange={(e) => setRoundId(e.target.value)}>
            {roundOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.course} · {r.dateLabel}
              </option>
            ))}
          </select>
        </label>
        <div className="scoring__toggle" role="group" aria-label="Score display">
          <button
            type="button"
            className={mode === 'net' ? 'is-active' : ''}
            onClick={() => setMode('net')}
          >
            Net
          </button>
          <button
            type="button"
            className={mode === 'gross' ? 'is-active' : ''}
            onClick={() => setMode('gross')}
          >
            Gross
          </button>
        </div>
        <button type="button" className="scoring__clear" onClick={clearRound}>
          Clear round
        </button>
      </div>

      <p className="scoring__meta">
        {card.name} · {card.tee} tees · Par {card.par} · {card.holes} holes
        {card.rating != null ? ` · ${card.rating}/${card.slope}` : ''}
      </p>
      <p className="scoring__hint">
        Shared for everyone. Enter gross — match points and skins update from this round’s
        format automatically.
      </p>

      <div className="scoring__table-wrap">
        <table className="scoring__table">
          <thead>
            <tr>
              <th scope="col">Hole</th>
              {card.holesDetail.map((h) => (
                <th key={h.number} scope="col">
                  {h.number}
                </th>
              ))}
              <th scope="col">Tot</th>
              <th scope="col">+/−</th>
            </tr>
            <tr className="scoring__par-row">
              <th scope="row">Par</th>
              {card.holesDetail.map((h) => (
                <td key={h.number}>{h.par}</td>
              ))}
              <td>{card.par}</td>
              <td />
            </tr>
            <tr className="scoring__si-row">
              <th scope="row">HCP</th>
              {card.holesDetail.map((h) => (
                <td key={h.number}>{h.strokeIndex}</td>
              ))}
              <td />
              <td />
            </tr>
            <tr className="scoring__yds-row">
              <th scope="row">Yds</th>
              {card.holesDetail.map((h) => (
                <td key={h.number}>{h.yards}</td>
              ))}
              <td>{card.holesDetail.reduce((s, h) => s + h.yards, 0)}</td>
              <td />
            </tr>
          </thead>
          <tbody>
            {ids.map((pid) => {
              const row = roundScores[pid]
              const grossTotal = sumDefined(row)
              const netVals = card.holesDetail.map((h, i) => netScore(pid, h, row[i]))
              const netTotal = sumDefined(netVals)
              const displayTotal = mode === 'net' ? netTotal : grossTotal
              const displayToPar = toPar(
                displayTotal,
                card.holesDetail,
                mode === 'net' ? netVals.map((n) => n) : row,
              )
              const strokes = strokesOffLow(pid)

              return (
                <tr key={pid}>
                  <th scope="row">
                    <span className="scoring__player">{playerName(pid)}</span>
                    <span className="scoring__strokes">
                      {strokes === 0 ? 'off 0' : `+${strokes}`}
                    </span>
                  </th>
                  {card.holesDetail.map((h, i) => (
                    <td key={h.number} className="scoring__cell">
                      <label className="scoring__input-wrap">
                        <span className="visually-hidden">
                          {playerName(pid)} hole {h.number}
                        </span>
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={row[i] ?? ''}
                          onChange={(e) => setHoleScore(pid, i, e.target.value)}
                        />
                        {getsStroke(pid, h) ? (
                          <span className="scoring__dot" title="Stroke hole" />
                        ) : null}
                        {mode === 'net' && row[i] != null ? (
                          <span className="scoring__net-mini">{netVals[i]}</span>
                        ) : null}
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

      {roundResult && (
        <div className="round-points">
          <div className="round-points__head">
            <h3>
              {roundResult.course} · {roundResult.format}
            </h3>
            <p>
              Match {ids.map((id) => `${playerName(id)} ${formatPoints(roundResult.matchPoints[id])}`).join(' · ')}
            </p>
            {schedule.find((r) => r.id === roundId)?.game.kind !== 'closest-to-pin' ? (
              <p>
                Skins{' '}
                {ids
                  .map((id) => `${playerName(id)} ${formatPoints(roundResult.skinPoints[id])}`)
                  .join(' · ')}
              </p>
            ) : (
              <p>CTP points count as match points on short courses.</p>
            )}
          </div>
          {roundResult.events.length > 0 ? (
            <ul className="round-points__events">
              {roundResult.events.map((e, i) => (
                <li key={`${e.label}-${i}`}>
                  <span className="round-points__label">{e.label}</span>
                  <span className="round-points__detail">{e.detail}</span>
                  <span className="round-points__pts">
                    {Object.entries(e.points)
                      .filter(([, v]) => v && v > 0)
                      .map(([id, v]) => `${playerName(id as PlayerId)} +${formatPoints(v!)}`)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="scoring__hint">Enter scores to calculate this round’s points.</p>
          )}
        </div>
      )}

      <p className="scoring__source">Scorecard source: {card.source}</p>
    </div>
  )
}
