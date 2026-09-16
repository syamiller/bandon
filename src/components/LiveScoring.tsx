import { useEffect, useState } from 'react'
import { schedule } from '../data/trip'
import { scorecardsByRoundId } from '../data/scorecards'
import {
  emptyScoresForCard,
  formatToPar,
  getsStroke,
  loadScores,
  netScore,
  playerIds,
  saveScores,
  sumDefined,
  toPar,
  type HoleScore,
  type RoundScores,
} from '../scoring'
import { playerName, strokesOffLow, type PlayerId } from '../data/trip'

export function LiveScoring() {
  const roundOptions = schedule.filter((r) => scorecardsByRoundId[r.id])
  const [roundId, setRoundId] = useState(roundOptions[0]?.id ?? 'trails')
  const [scores, setScores] = useState<RoundScores>({})
  const [mode, setMode] = useState<'gross' | 'net'>('net')

  const card = scorecardsByRoundId[roundId]

  useEffect(() => {
    setScores(loadScores())
  }, [])

  useEffect(() => {
    if (!card) return
    setScores((prev) => {
      if (prev[roundId]) return prev
      const next = { ...prev, [roundId]: emptyScoresForCard(card) }
      saveScores(next)
      return next
    })
  }, [roundId, card])

  if (!card) return null

  const roundScores = scores[roundId] ?? emptyScoresForCard(card)
  const ids = playerIds()

  function setHoleScore(playerId: PlayerId, holeIndex: number, value: string) {
    const parsed: HoleScore =
      value === '' ? null : Math.max(1, Math.min(15, Number.parseInt(value, 10) || 0))
    setScores((prev) => {
      const current = prev[roundId] ?? emptyScoresForCard(card!)
      const playerRow = [...(current[playerId] ?? emptyScoresForCard(card!)[playerId])]
      playerRow[holeIndex] = parsed === 0 ? null : parsed
      const next: RoundScores = {
        ...prev,
        [roundId]: { ...current, [playerId]: playerRow },
      }
      saveScores(next)
      return next
    })
  }

  function clearRound() {
    if (!confirm(`Clear all scores for ${card.name}?`)) return
    setScores((prev) => {
      const next = { ...prev, [roundId]: emptyScoresForCard(card) }
      saveScores(next)
      return next
    })
  }

  return (
    <div className="scoring">
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
        Enter gross scores. Dots mark stroke holes (off Simon). Skins use net.
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
              const row = roundScores[pid] ?? emptyScoresForCard(card)[pid]
              const grossTotal = sumDefined(row)
              const netVals = card.holesDetail.map((h, i) => netScore(pid, h, row[i]))
              const netTotal = sumDefined(netVals)
              const displayTotal = mode === 'net' ? netTotal : grossTotal
              const displayToPar = toPar(
                displayTotal,
                card.holesDetail,
                mode === 'net'
                  ? netVals.map((n) => n)
                  : row,
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

      <p className="scoring__source">Scorecard source: {card.source}</p>
    </div>
  )
}
