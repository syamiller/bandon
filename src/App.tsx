import {
  cup,
  formatDetails,
  pairLabel,
  playerName,
  players,
  roundsByDay,
  schedule,
  type Round,
} from './data/trip'
import './App.css'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=2400&q=80'

function App() {
  const days = roundsByDay()

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__media" aria-hidden="true">
          <img src={HERO_IMAGE} alt="" className="hero__img" />
          <div className="hero__scrim" />
        </div>
        <nav className="nav">
          <a href="#schedule">Schedule</a>
          <a href="#cup">The Cup</a>
          <a href="#games">Games</a>
        </nav>
        <div className="hero__copy">
          <p className="brand">Bandon</p>
          <h1>Seven rounds. One coast. Best ball all week.</h1>
          <p className="hero__lede">
            Nov 15–18, 2026 — Trails through Sheep Ranch, with a running Cup and a fresh
            format every tee time.
          </p>
          <div className="hero__ctas">
            <a className="btn btn--solid" href="#schedule">
              See the schedule
            </a>
            <a className="btn btn--ghost" href="#games">
              Round games
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section section--players" aria-label="Players">
          <p className="eyebrow">The four</p>
          <ul className="players">
            {players.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </section>

        <section id="schedule" className="section">
          <div className="section__head">
            <p className="eyebrow">Tee sheet</p>
            <h2>Full schedule</h2>
            <p className="section__lede">
              Four days, seven courses — every round locked for best ball.
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
                        <span className="tee__course">{round.course}</span>
                        <span className="tee__format">
                          {formatDetails[round.sideGame.format].label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="cup" className="section section--cup">
          <div className="section__head">
            <p className="eyebrow">Across the trip</p>
            <h2>{cup.name}</h2>
            <p className="section__lede">{cup.description}</p>
          </div>
          <div className="cup-board">
            {cup.teams.map((team) => (
              <div key={team.id} className="cup-team">
                <h3>{team.name}</h3>
                <p>
                  {playerName(team.players[0])} & {playerName(team.players[1])}
                </p>
              </div>
            ))}
            <p className="cup-vs" aria-hidden="true">
              vs
            </p>
          </div>
          <p className="cup-scoring">{cup.scoring}</p>
          <ol className="cup-rounds">
            {schedule.map((round, i) => (
              <li key={round.id}>
                <span className="cup-rounds__n">{i + 1}</span>
                <span className="cup-rounds__course">{round.course}</span>
                <span className="cup-rounds__meta">
                  {round.dateLabel} · {formatDetails[round.sideGame.format].label}
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
              Always best ball. Partners and formats rotate so nobody plays the same game
              twice.
            </p>
          </div>
          <div className="games">
            {schedule.map((round) => (
              <RoundGame key={round.id} round={round} />
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Bandon Dunes Golf Resort · November 2026</p>
        <p className="footer__note">
          Edit names and pairings in <code>src/data/trip.ts</code>
        </p>
      </footer>
    </div>
  )
}

function RoundGame({ round }: { round: Round }) {
  const format = formatDetails[round.sideGame.format]
  const { teamA, teamB } = round.sideGame

  return (
    <article id={`game-${round.id}`} className="game">
      <header className="game__head">
        <div>
          <p className="game__when">
            {round.weekday}, {round.dateLabel} · {round.teeTime}
          </p>
          <h3>{round.course}</h3>
        </div>
        <p className="game__badge">{format.label}</p>
      </header>
      <p className="game__blurb">{format.blurb}</p>
      <div className="game__match">
        <div className="game__side">
          <p className="game__side-label">Side A</p>
          <p className="game__pair">{pairLabel(teamA)}</p>
        </div>
        <p className="game__vs">vs</p>
        <div className="game__side">
          <p className="game__side-label">Side B</p>
          <p className="game__pair">{pairLabel(teamB)}</p>
        </div>
      </div>
      <p className="game__rule">Best ball · both scores count toward The Bandon Cup sides</p>
    </article>
  )
}

export default App
