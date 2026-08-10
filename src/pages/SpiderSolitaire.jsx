import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  dealInitialGame,
  isSequenceRun,
  moveCards,
  canDealFromStock,
  dealFromStock,
  isGameWon,
  computeScore,
  cloneState,
  rankLabel,
  isRedSuit,
} from "../services/spiderSolitaireEngine"

import {
  getHighScores,
  addHighScore,
} from "../services/spiderSolitaireHighScores"


const DIFFICULTIES = [
  { value: 1, label: "1 maa", hint: "Helpoin" },
  { value: 2, label: "2 maata", hint: "Keskitaso" },
  { value: 4, label: "4 maata", hint: "Vaikein" },
]

function difficultyLabel(value) {
  return DIFFICULTIES.find((d) => d.value === value)?.label || `${value} maata`
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}


function SpiderSolitaire() {
  const [game, setGame] = useState(
    () => dealInitialGame(2),
  )

  const [selected, setSelected] =
    useState(null)

  const [history, setHistory] =
    useState([])

  const [gameId, setGameId] =
    useState(0)

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0)

  const [highScores, setHighScores] =
    useState(() => getHighScores(game.difficulty))

  const [justRecorded, setJustRecorded] =
    useState(null)

  const recordedRef = useRef(false)

  const won = isGameWon(game)

  useEffect(() => {
    if (won) return

    const id = setInterval(
      () => setElapsedSeconds((s) => s + 1),
      1000,
    )

    return () => clearInterval(id)
  }, [won, gameId])

  useEffect(() => {
    if (!won || recordedRef.current) return

    recordedRef.current = true

    const score = computeScore({
      difficulty: game.difficulty,
      moveCount: game.moveCount,
      seconds: elapsedSeconds,
    })

    const { list, rank } = addHighScore(game.difficulty, {
      score,
      moves: game.moveCount,
      seconds: elapsedSeconds,
      date: new Date().toISOString(),
    })

    setHighScores(list)
    setJustRecorded({ rank, score })
  }, [won, game.difficulty, game.moveCount, elapsedSeconds])

  function startNewGame(difficulty) {
    setGame(dealInitialGame(difficulty))
    setSelected(null)
    setHistory([])
    setGameId((id) => id + 1)
    setElapsedSeconds(0)
    setHighScores(getHighScores(difficulty))
    setJustRecorded(null)
    recordedRef.current = false
  }

  function pushHistory(prevState) {
    setHistory(
      (h) => [...h, prevState].slice(-50),
    )
  }

  function handleUndo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setGame(prev)
    setHistory((h) => h.slice(0, -1))
    setSelected(null)
  }

  function handleStockClick() {
    if (!canDealFromStock(game)) return

    const next = dealFromStock(game)
    if (!next) return

    pushHistory(cloneState(game))
    setGame(next)
    setSelected(null)
  }

  function handleCardClick(col, index) {
    const column = game.tableau[col]
    const card = column[index]
    if (!card.faceUp) return

    if (!selected) {
      if (isSequenceRun(column, index)) {
        setSelected({ col, index })
      }
      return
    }

    if (selected.col === col && selected.index === index) {
      setSelected(null)
      return
    }

    if (selected.col === col) {
      if (isSequenceRun(column, index)) {
        setSelected({ col, index })
      }
      return
    }

    attemptMove(selected.col, selected.index, col)
  }

  function handleColumnAreaClick(col) {
    if (!selected) return
    if (selected.col === col) {
      setSelected(null)
      return
    }
    attemptMove(selected.col, selected.index, col)
  }

  function handleCardDragStart(e, col, index) {
    const column = game.tableau[col]
    const card = column[index]

    if (!card.faceUp || !isSequenceRun(column, index)) {
      e.preventDefault()
      return
    }

    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ col, index }),
    )
    setSelected({ col, index })
  }

  function handleColumnDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  function handleColumnDrop(e, destCol) {
    e.preventDefault()

    let parsed
    try {
      parsed = JSON.parse(e.dataTransfer.getData("text/plain"))
    } catch {
      return
    }
    if (!parsed) return

    attemptMove(parsed.col, parsed.index, destCol)
  }

  function attemptMove(sourceCol, cardIndex, destCol) {
    const next = moveCards(game, sourceCol, cardIndex, destCol)

    if (!next) {
      const destColumn = game.tableau[destCol]
      if (
        destColumn.length > 0 &&
        isSequenceRun(destColumn, destColumn.length - 1)
      ) {
        setSelected({
          col: destCol,
          index: destColumn.length - 1,
        })
      } else {
        setSelected(null)
      }
      return
    }

    pushHistory(cloneState(game))
    setGame(next)
    setSelected(null)
  }

  return (
    <div className="space-y-8">
      <header
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.25em]
              text-[var(--wood-accent)]
            "
          >
            Tauko
          </p>

          <h1
            className="
              mt-2
              text-4xl
              font-bold
              text-[var(--wood-text)]
            "
          >
            ♤ Spider-pasianssi
          </h1>

          <p
            className="
              mt-3
              max-w-2xl
              text-[var(--wood-muted)]
            "
          >
            Järjestä kortit maittain
            kuninkaasta ässään samaan
            pinoon. Raahaa kortti
            kohdepinoon, tai klikkaa
            korttia valitaksesi sarjan
            ja klikkaa sitten
            kohdepinoa siirtääksesi.
          </p>
        </div>

        <GameStatus
          game={game}
          won={won}
          elapsedSeconds={elapsedSeconds}
          justRecorded={justRecorded}
        />
      </header>

      <section
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => startNewGame(d.value)}
            className="
              rounded-xl
              border
              px-4
              py-2
              text-sm
              font-semibold
              transition
            "
            style={{
              borderColor:
                game.difficulty === d.value
                  ? "var(--wood-accent)"
                  : "var(--wood-border)",
              background:
                game.difficulty === d.value
                  ? "var(--wood-card)"
                  : "transparent",
              color:
                game.difficulty === d.value
                  ? "var(--wood-accent)"
                  : "var(--wood-muted)",
            }}
          >
            Uusi peli · {d.label}
            <span
              className="
                ml-2
                text-xs
                opacity-70
              "
            >
              {d.hint}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="
            rounded-xl
            border
            px-4
            py-2
            text-sm
            font-semibold
            transition
            disabled:opacity-30
          "
          style={{
            borderColor: "var(--wood-border)",
            color: "var(--wood-muted)",
          }}
        >
          ↶ Kumoa
        </button>
      </section>

      <section
        className="
          rounded-2xl
          border
          p-6
        "
        style={{
          borderColor: "var(--wood-border)",
          background: "var(--wood-panel)",
        }}
      >
        <div
          className="
            flex
            items-center
            gap-6
          "
        >
          <StockPile
            count={game.stock.length}
            canDeal={canDealFromStock(game)}
            onClick={handleStockClick}
          />

          <CompletedFoundations
            completed={game.completed}
          />
        </div>

        <div
          className="
            mt-8
            grid
            grid-cols-10
            gap-3
            overflow-x-auto
          "
        >
          {game.tableau.map((column, col) => (
            <TableauColumn
              key={col}
              column={column}
              col={col}
              selected={selected}
              onCardClick={handleCardClick}
              onAreaClick={handleColumnAreaClick}
              onCardDragStart={handleCardDragStart}
              onColumnDragOver={handleColumnDragOver}
              onColumnDrop={handleColumnDrop}
            />
          ))}
        </div>
      </section>

      <HighScoresPanel
        difficulty={game.difficulty}
        highScores={highScores}
      />
    </div>
  )
}


function HighScoresPanel({ difficulty, highScores }) {
  return (
    <section
      className="
        rounded-2xl
        border
        p-6
      "
      style={{
        borderColor: "var(--wood-border)",
        background: "var(--wood-panel)",
      }}
    >
      <h2
        className="
          text-lg
          font-bold
          text-[var(--wood-text)]
        "
      >
        ✦ Parhaat tulokset · {difficultyLabel(difficulty)}
      </h2>

      {highScores.length === 0 ? (
        <p
          className="
            mt-3
            text-sm
          "
          style={{ color: "var(--wood-muted)" }}
        >
          Ei vielä tuloksia tällä vaikeustasolla.
          Voita peli kirjatakseksi ennätyksen.
        </p>
      ) : (
        <div
          className="
            mt-4
            overflow-x-auto
          "
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="
                  text-left
                  text-xs
                  uppercase
                  tracking-widest
                "
                style={{ color: "var(--wood-muted)" }}
              >
                <th className="pb-2 pr-4">Sija</th>
                <th className="pb-2 pr-4">Pisteet</th>
                <th className="pb-2 pr-4">Siirrot</th>
                <th className="pb-2 pr-4">Aika</th>
                <th className="pb-2">Pvm</th>
              </tr>
            </thead>

            <tbody>
              {highScores.map((entry, i) => (
                <tr
                  key={`${entry.date}-${i}`}
                  style={{
                    borderTop: "1px solid var(--wood-border)",
                  }}
                >
                  <td
                    className="py-2 pr-4 font-semibold"
                    style={{
                      color:
                        i === 0
                          ? "var(--wood-accent)"
                          : "var(--wood-text)",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td
                    className="py-2 pr-4 font-semibold"
                    style={{ color: "var(--wood-text)" }}
                  >
                    {entry.score}
                  </td>
                  <td
                    className="py-2 pr-4"
                    style={{ color: "var(--wood-muted)" }}
                  >
                    {entry.moves}
                  </td>
                  <td
                    className="py-2 pr-4"
                    style={{ color: "var(--wood-muted)" }}
                  >
                    {formatTime(entry.seconds)}
                  </td>
                  <td
                    style={{ color: "var(--wood-muted)" }}
                  >
                    {formatDate(entry.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}


function GameStatus({ game, won, elapsedSeconds, justRecorded }) {
  if (won) {
    return (
      <div
        className="
          rounded-xl
          border
          px-4
          py-3
          text-sm
          font-semibold
        "
        style={{
          borderColor: "var(--wood-green)",
          color: "var(--wood-green)",
          background: "var(--wood-card)",
        }}
      >
        ✦ Voitit pelin
        {" "}
        {game.moveCount} siirrolla
        ajassa {formatTime(elapsedSeconds)}!
        {justRecorded && (
          <>
            {" "}· {justRecorded.score} pistettä
            {justRecorded.rank
              ? ` · Sija ${justRecorded.rank} parhaissa tuloksissa!`
              : ""}
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className="
        flex
        gap-4
        text-sm
      "
      style={{ color: "var(--wood-muted)" }}
    >
      <span>Aika: {formatTime(elapsedSeconds)}</span>
      <span>Siirrot: {game.moveCount}</span>
      <span>
        Valmiit sarjat: {game.completed.length} / 8
      </span>
    </div>
  )
}


function StockPile({ count, canDeal, onClick }) {
  const stacks = Math.min(5, Math.ceil(count / 10) || 0)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canDeal}
      title={
        canDeal
          ? "Jaa uusi kierros kaikkiin pinoihin"
          : count === 0
          ? "Pakka on tyhjä"
          : "Kaikissa pinoissa täytyy olla kortti ennen jakoa"
      }
      className="
        relative
        h-24
        w-16
        shrink-0
        disabled:opacity-40
      "
    >
      {stacks === 0 && (
        <div
          className="
            flex
            h-24
            w-16
            items-center
            justify-center
            rounded-lg
            border
            border-dashed
            text-xs
          "
          style={{
            borderColor: "var(--wood-border)",
            color: "var(--wood-muted)",
          }}
        >
          Tyhjä
        </div>
      )}

      {Array.from({ length: stacks }).map((_, i) => (
        <div
          key={i}
          className="
            absolute
            h-24
            w-16
            rounded-lg
            border
          "
          style={{
            top: -i * 3,
            left: -i * 3,
            borderColor: "var(--wood-border)",
            background:
              "repeating-linear-gradient(45deg, var(--wood-card), var(--wood-card) 6px, var(--wood-border) 6px, var(--wood-border) 12px)",
          }}
        />
      ))}
    </button>
  )
}


function CompletedFoundations({ completed }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 8 }).map((_, i) => {
        const entry = completed[i]

        return (
          <div
            key={i}
            className="
              flex
              h-24
              w-16
              items-center
              justify-center
              rounded-lg
              border
              text-2xl
              font-bold
            "
            style={{
              borderColor: "var(--wood-border)",
              background: entry
                ? "var(--wood-card)"
                : "transparent",
              color: entry
                ? isRedSuit(entry.suit)
                  ? "#f87171"
                  : "var(--wood-text)"
                : "var(--wood-border)",
            }}
          >
            {entry ? entry.suit : ""}
          </div>
        )
      })}
    </div>
  )
}


function TableauColumn({
  column,
  col,
  selected,
  onCardClick,
  onAreaClick,
  onCardDragStart,
  onColumnDragOver,
  onColumnDrop,
}) {
  const OVERLAP = 26
  const height = 132 + Math.max(0, column.length - 1) * OVERLAP

  return (
    <div
      className="relative"
      style={{ height, minWidth: 76 }}
      onClick={() => onAreaClick(col)}
      onDragOver={onColumnDragOver}
      onDrop={(e) => onColumnDrop(e, col)}
    >
      {column.length === 0 && (
        <div
          className="
            h-32
            w-full
            rounded-lg
            border
            border-dashed
          "
          style={{ borderColor: "var(--wood-border)" }}
        />
      )}

      {column.map((card, index) => {
        const isSelected =
          selected &&
          selected.col === col &&
          index >= selected.index

        const draggable =
          card.faceUp && isSequenceRun(column, index)

        return (
          <PlayingCard
            key={card.id}
            card={card}
            style={{
              position: "absolute",
              top: index * OVERLAP,
              left: 0,
              zIndex: index,
            }}
            selected={isSelected}
            draggable={draggable}
            onDragStart={(e) => onCardDragStart(e, col, index)}
            onClick={(e) => {
              e.stopPropagation()
              onCardClick(col, index)
            }}
          />
        )
      })}
    </div>
  )
}


function PlayingCard({ card, style, selected, draggable, onDragStart, onClick }) {
  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        style={{
          ...style,
          borderColor: "var(--wood-border)",
          background:
            "repeating-linear-gradient(45deg, var(--wood-card), var(--wood-card) 6px, var(--wood-border) 6px, var(--wood-border) 12px)",
        }}
        className="
          h-32
          w-[76px]
          cursor-pointer
          rounded-lg
          border
        "
      />
    )
  }

  const red = isRedSuit(card.suit)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        ...style,
        borderColor: selected
          ? "var(--wood-accent)"
          : "var(--wood-border)",
        boxShadow: selected
          ? "0 0 0 2px var(--wood-accent)"
          : "0 2px 4px rgba(0,0,0,0.4)",
        cursor: draggable ? "grab" : "pointer",
      }}
      className="
        h-32
        w-[76px]
        cursor-pointer
        select-none
        rounded-lg
        border
        bg-[#f4ecd8]
        px-2
        py-1
        text-black
      "
    >
      <div
        className="
          flex
          items-center
          gap-1
          text-sm
          font-bold
          leading-none
        "
        style={{ color: red ? "#b91c1c" : "#111827" }}
      >
        <span>{rankLabel(card.rank)}</span>
        <span>{card.suit}</span>
      </div>

      <div
        className="
          mt-1
          flex
          h-full
          items-center
          justify-center
          text-3xl
        "
        style={{ color: red ? "#b91c1c" : "#111827" }}
      >
        {card.suit}
      </div>
    </div>
  )
}


export default SpiderSolitaire
