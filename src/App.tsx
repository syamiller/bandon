import {
  pairLabel,
  playerName,
  players,
  roundsByDay,
  schedule,
  strokesOffLow,
  tripRace,
  type Round,
  type RoundGame,
} from './data/trip'
import { LiveScoring } from './components/LiveScoring'
import './App.css'

const HERO_IMAGE = '/bandon-dunes-hero.jpg'

function App() {
  const days = roundsByDay()

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
          <h1>Seven rounds. Match wins and skins.</h1>
          <p className="hero__lede">
            Nov 15–18, 2026 — Simon, Zach, Emory, and Sammy. Live scoring with handicaps —
            everyone plays off Simon.
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
          <p className="eyebrow">The four · playing off Simon</p>
          <ul className="players">
            {players.map((p) => (
              <li key={p.id}>
                {p.name}
                <span className="players__hcp">
                  {p.handicap}
                  {strokesOffLow(p.id) > 0 ? ` · +${strokesOffLow(p.id)}` : ' · scratch'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="schedule" className="section">
          <div className="section__head">
            <p className="eyebrow">Tee sheet</p>
            <h2>Full schedule</h2>
            <p className="section__lede">
              Four days, seven tee times — Preserve and Shorty’s are the short courses.
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
              Best ball, Wolf, closest-to-the-pin, and 6-hole 1v1s — skins are always on
              top, every round.
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
              Full scorecards for every course. Scores sync for everyone — match points and
              skins calculate from each round’s format. Playing off Simon.
            </p>
          </div>
          <LiveScoring />
        </section>
      </main>

      <footer className="footer">
        <p>Bandon Dunes Golf Resort · November 2026</p>
        <p className="footer__note">
          Edit formats and pairings in <code>src/data/trip.ts</code>
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
          <p className="game__pair">{pairLabel(game.teamA)}</p>
        </div>
        <p className="game__vs">vs</p>
        <div className="game__side">
          <p className="game__side-label">Side B</p>
          <p className="game__pair">{pairLabel(game.teamB)}</p>
        </div>
      </div>
    )
  }

  if (game.kind === 'closest-to-pin') {
    return (
      <ul className="game__field">
        {game.field.map((id) => (
          <li key={id}>{playerName(id)}</li>
        ))}
      </ul>
    )
  }

  if (game.kind === 'wolf') {
    return (
      <div className="game__wolf">
        <p className="game__side-label">Starting tee order (rotates as Wolf)</p>
        <ol className="game__order">
          {game.order.map((id, i) => (
            <li key={id}>
              <span className="game__order-n">{i + 1}</span>
              <span className="game__pair">{playerName(id)}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  const blocks = ['1–6', '7–12', '13–18'] as const
  return (
    <div className="game__sixes">
      {blocks.map((holes) => {
        const matches = game.matches.filter((m) => m.holes === holes)
        return (
          <div key={holes} className="game__sixes-block">
            <p className="game__side-label">Holes {holes}</p>
            <ul>
              {matches.map((m) => (
                <li key={`${holes}-${m.a}-${m.b}`}>
                  <span className="game__pair">{playerName(m.a)}</span>
                  <span className="game__vs-inline">vs</span>
                  <span className="game__pair">{playerName(m.b)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default App
