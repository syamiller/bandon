import { useCallback, useMemo, useState } from 'react'
import {
  pairLabel,
  playerName,
  players,
  roundsByDay,
  createSchedule,
  defaultTeamAssignments,
  sameTeamAssignments,
  type TeamAssignments,
  tripRace,
  type Round,
  type RoundGame,
} from './data/trip'
import { LiveScoring } from './components/LiveScoring'
import './App.css'

const HERO_IMAGE = '/bandon-dunes-hero.jpg'

function App() {
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignments>(defaultTeamAssignments)
  const updateTeamAssignments = useCallback((next: TeamAssignments) => {
    setTeamAssignments((current) => sameTeamAssignments(current, next) ? current : next)
  }, [])
  const schedule = useMemo(() => createSchedule(teamAssignments), [teamAssignments])
  const days = roundsByDay(schedule)

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__media" aria-hidden="true">
          <img
            src={HERO_IMAGE}
            alt="Bandon Dunes Golf Resort — coastal links along the Pacific"
            className="hero__img"
          />
          <div className="hero__scrim" />
        </div>
        <nav className="nav">
          <a href="#schedule">Schedule</a>
          <a href="#points">Points</a>
          <a href="#games">Games</a>
          <a href="#scoring">Score</a>
        </nav>
        <div className="hero__copy">
          <p className="brand">Bandon</p>
          <h1>Seven rounds. Every point live.</h1>
          <p className="hero__lede">
            Nov 15–18, 2026 — Simon, Zach, Emory, and Sammy. GHIN-adjusted matches, trip
            Stableford, and shared live scoring.
          </p>
          <div className="hero__ctas">
            <a className="btn btn--solid" href="#scoring">
              Live scoring
            </a>
            <a className="btn btn--ghost" href="#schedule">
              Schedule
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section section--players" aria-label="Players">
          <p className="eyebrow">The four · GHIN Handicap Index</p>
          <ul className="players">
            {teamAssignments.slots.map((id, i) => {
              const p = players.find((player) => player.id === id)!
              return <li key={p.id}><span className="players__slot">Player {i + 1} · </span>{p.name}<span className="players__hcp">GHIN {p.handicap.toFixed(1)}</span></li>
            })}
          </ul>
        </section>

        <section id="schedule" className="section">
          <div className="section__head">
            <p className="eyebrow">Tee sheet</p>
            <h2>Full schedule</h2>
            <p className="section__lede">
              Seven rounds across four days. Partners stay together through each day’s team games; the final day is individual St. James Roll.
            </p>
          </div>
          <div className="days">
            {days.map((day) => (
              <article key={day.dateLabel} className="day">
                <header className="day__head">
                  <h3>{day.dateLabel}</h3>
                  <span>{day.weekday}</span>
                </header>
                <ul className="tee-list">
                  {day.rounds.map((round) => (
                    <li key={round.id}>
                      <a href={`#game-${round.id}`} className="tee">
                        <time>{round.teeTime}</time>
                        <span className="tee__course">
                          {round.course}
                          {round.shortCourse ? (
                            <span className="tee__tag">Short</span>
                          ) : null}
                        </span>
                        <span className="tee__format">{round.game.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="points" className="section section--cup">
          <div className="section__head">
            <p className="eyebrow">Across the trip</p>
            <h2>{tripRace.name}</h2>
            <p className="section__lede">{tripRace.description}</p>
          </div>
          <div className="points-rules">
            {tripRace.rules.map((rule) => (
              <div key={rule.title} className="points-rule">
                <h3>{rule.title}</h3>
                <p>{rule.detail}</p>
              </div>
            ))}
          </div>
          <ol className="cup-rounds">
            {schedule.map((round, i) => (
              <li key={round.id}>
                <span className="cup-rounds__n">{i + 1}</span>
                <span className="cup-rounds__course">
                  {round.course}
                  {round.shortCourse ? <span className="tee__tag">Short</span> : null}
                </span>
                <span className="cup-rounds__meta">
                  {round.dateLabel} · {round.game.label}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="games" className="section">
          <div className="section__head">
            <p className="eyebrow">Every tee time</p>
            <h2>Round games</h2>
            <p className="section__lede">
              Nassau, best ball, combined net, singles, and St. James Roll — every round’s
              point pool is shown with its live pairings.
            </p>
          </div>
          <div className="games">
            {schedule.map((round) => (
              <RoundGameCard key={round.id} round={round} />
            ))}
          </div>
        </section>

        <section id="scoring" className="section">
          <div className="section__head">
            <p className="eyebrow">Live card</p>
            <h2>Scorekeeping</h2>
            <p className="section__lede">
              Full scorecards for every course. Gross scores sync for everyone — course
              handicaps, round points, Stableford, and the trip board recalculate live.
            </p>
          </div>
          <LiveScoring
            rounds={schedule}
            teamAssignments={teamAssignments}
            onTeamAssignmentsChange={updateTeamAssignments}
          />
        </section>
      </main>

      <footer className="footer">
        <p>Bandon Dunes Golf Resort · November 2026</p>
        <p className="footer__note">
          Team slots, match pairings, and GHIN indexes update from the live scoring card.
        </p>
      </footer>
    </div>
  )
}

function RoundGameCard({ round }: { round: Round }) {
  const { game } = round

  return (
    <article id={`game-${round.id}`} className="game">
      <header className="game__head">
        <div>
          <p className="game__when">
            {round.weekday}, {round.dateLabel} · {round.teeTime}
            {round.shortCourse ? ' · Short course' : ''}
          </p>
          <h3>{round.course}</h3>
        </div>
        <p className="game__badge">{game.label}</p>
      </header>
      <p className="game__blurb">{game.blurb}</p>
      <GameDetail game={game} />
    </article>
  )
}

function GameDetail({ game }: { game: RoundGame }) {
  if (game.kind === 'best-ball') {
    return (
      <div className="game__match">
        <div className="game__side">
          <p className="game__side-label">Side A</p>
          <p className="game__pair">{pairLabel(game.teams[0])}</p>
        </div>
        <p className="game__vs">vs</p>
        <div className="game__side">
          <p className="game__side-label">Side B</p>
          <p className="game__pair">{pairLabel(game.teams[1])}</p>
        </div>
      </div>
    )
  }

  if (game.kind === 'singles') {
    return (
      <div className="game__sixes">
        <div className="game__side"><p className="game__side-label">Day teams</p><p className="game__pair">{pairLabel(game.teams[0])} · {pairLabel(game.teams[1])}</p></div>
        <ul>{game.matches.map((match) => <li key={`${match.label}-${match.pair.join('-')}`}><span>{match.label}</span><span className="game__pair">{playerName(match.pair[0])} vs {playerName(match.pair[1])}</span></li>)}</ul>
      </div>
    )
  }

  if (game.kind === 'combined-stroke') {
    return (
      <div className="game__match">
        <div className="game__side"><p className="game__side-label">Side A</p><p className="game__pair">{pairLabel(game.teams[0])}</p></div>
        <p className="game__vs">vs</p>
        <div className="game__side"><p className="game__side-label">Side B</p><p className="game__pair">{pairLabel(game.teams[1])}</p></div>
      </div>
    )
  }
  return (
    <div className="game__wolf">
      <p className="game__side-label">Individual net scoring · 6 dots available per hole</p>
      <p className="game__pair">{game.blurb}</p>
    </div>
  )
}

export default App
