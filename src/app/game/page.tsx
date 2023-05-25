"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { defaultDeck } from "../../utils/decks"
import shuffle from "../../utils/shuffle"
import styles from "./game.module.css"

export default function Game() {
  const [phase, setPhase] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [unoButtonIsPressed, setUnoButtonIsPressed] = useState(false)
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [player1, setPlayer1] = useState([] as string[])
  const [player2, setPlayer2] = useState([] as string[])
  const [deck, setDeck] = useState([] as string[])
  const [discard, setDiscard] = useState([] as string[])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")
  const [drawButton, setDrawButton] = useState(0)

  function initializeGame() {
    setGameOver(false)
    setWinner("")
    setDeck(shuffleDeck(defaultDeck))
    setPhase(1)
  }

  const shuffleDeck = (deck: string[]) => {
    return shuffle(deck)
  }

  const dealCards = () => {
    let _deck = [...deck]
    let dl = _deck.length
    const player1Hand = _deck.slice(dl - 7, dl)
    const player2Hand = _deck.slice(dl - 14, dl - 7)
    const newDeck = _deck.slice(0, dl - 14)
    setPlayer1(player1Hand)
    setPlayer2(player2Hand)
    setDeck(newDeck)
    setPhase(2)
  }

  const setStartingCard = () => {
    let _deck = [...deck]
    let _discard = [...discard]
    let startingCard: string
    do {
      startingCard = _deck.pop() || ""
      _discard.push(startingCard)
    } while (!/^\d/.test(startingCard))

    setDiscard(_discard)
    setDeck(_deck)
    setCurrentValue(startingCard[0])
    setCurrentColor(startingCard[1])
    setTurnPlayer(1)
    setPhase(3)
  }

  const removeCardFromHand = (
    player: number,
    index: number,
    player1NeedsToDraw2: boolean,
    player2NeedsToDraw2: boolean
  ) => {
    if (player === 1) {
      let _player1 = [...player1]
      _player1.splice(index, 1)
      if (!player1NeedsToDraw2) setPlayer1(_player1)
    } else if (player === 2) {
      let _player2 = [...player2]
      _player2.splice(index, 1)
      if (!player2NeedsToDraw2) setPlayer2(_player2)
    }

    let _deck = [...deck]
    let lastCard = ""

    if (player1NeedsToDraw2) {
      let _player1 = [...player1]
      for (let i = 0; i < 2; i++) {
        lastCard = _deck.pop() || ""
        _player1.push(lastCard)
      }
      setPlayer1(_player1)
      setDeck(_deck)
    }
    if (player2NeedsToDraw2) {
      let _player2 = [...player2]
      for (let i = 0; i < 2; i++) {
        lastCard = _deck.pop() || ""
        _player2.push(lastCard)
      }
      setPlayer2(_player2)
      setDeck(_deck)
    }
  }

  const drawCards = (player: number, amount: number) => {
    let _deck = [...deck]
    let lastCard = ""
    if (player === 1) {
      let _player1 = [...player1]
      for (let i = 0; i < amount; i++) {
        lastCard = _deck.pop() || ""
        _player1.push(lastCard)
      }
      setPlayer1(_player1)
    } else if (player === 2) {
      let _player2 = [...player2]
      for (let i = 0; i < amount; i++) {
        lastCard = _deck.pop() || ""
        _player2.push(lastCard)
      }
      setPlayer2(_player2)
    }
    setDeck(_deck)
    return lastCard
  }

  const checkCardPlayable = (newCard: string) => {
    return (
      newCard[0] === currentValue ||
      newCard[1] === currentColor ||
      newCard === "W=" ||
      newCard === "W+"
    )
  }

  const checkHandPlayable = (player: number) => {
    if (player === 1) {
      for (let i = 0; i < player1.length; i++) {
        if (
          player1[i][0] === currentValue ||
          player1[i][1] === currentColor ||
          player1[i] === "W=" ||
          player1[i] === "W+"
        ) {
          return true
        }
      }
    }
    if (player === 2) {
      for (let i = 0; i < player2.length; i++) {
        if (
          player2[i][0] === currentValue ||
          player2[i][1] === currentColor ||
          player2[i] === "W=" ||
          player2[i] === "W+"
        ) {
          return true
        }
      }
    }
  }

  useEffect(() => {
    if (phase === 0) initializeGame()
  }, [])

  useEffect(() => {
    if (phase === 1) dealCards()
    if (phase === 2) setStartingCard()
  }, [deck])

  useEffect(() => {
    if (phase === 3) {
      // check if player has won
      if (player1.length === 0) {
        // set winner
        setWinner("Player 1")
        // set game over
        setPhase(4)
        setGameOver(true)
      }
      if (player2.length === 0) {
        // set winner
        setWinner("Player 2")
        // set game over
        setPhase(4)
        setGameOver(true)
      }

      // check if player has uno

      if (!checkHandPlayable(turnPlayer)) {
        setDrawButton(turnPlayer)
      }
    }
  }, [player1, player2])

  useEffect(() => {
    if (phase === 3) {
      if (!checkHandPlayable(turnPlayer)) {
        setDrawButton(turnPlayer)
      } else {
        setDrawButton(0)
      }
    }
  }, [turnPlayer])

  const onCardPlayedHandler = (
    player: number,
    playedCard: string,
    index: number
  ) => {
    const playedCardValue: string = playedCard[0]
    const playedCardColor: string = playedCard[1]
    let player1NeedsToDraw2 = false
    let player2NeedsToDraw2 = false
    if (player !== turnPlayer) return

    if (!unoButtonIsPressed && turnPlayer === 1 && player1.length === 2) {
      player1NeedsToDraw2 = true
    }
    if (!unoButtonIsPressed && turnPlayer === 2 && player2.length === 2) {
      player2NeedsToDraw2 = true
    }

    if (playedCardValue === "W") {
      removeCardFromHand(
        player,
        index,
        player1NeedsToDraw2,
        player2NeedsToDraw2
      )
      setCurrentValue(playedCardValue)
      setCurrentColor(prompt("Choose a color (R,G,B,Y)") || "R")
      setDiscard([...discard, playedCard])
      if (playedCardColor === "+") {
        setTurnPlayer(turnPlayer === 1 ? 1 : 2)
        drawCards(turnPlayer === 1 ? 2 : 1, 4)
      } else {
        setTurnPlayer(turnPlayer === 1 ? 2 : 1)
      }
    }
    if (playedCardValue !== currentValue && playedCardColor !== currentColor)
      return
    if (/^\d/.test(playedCardValue)) {
      removeCardFromHand(
        player,
        index,
        player1NeedsToDraw2,
        player2NeedsToDraw2
      )
      setCurrentValue(playedCardValue)
      setCurrentColor(playedCardColor)
      setDiscard([...discard, playedCard])
      setTurnPlayer(turnPlayer === 1 ? 2 : 1)
    }
    if (playedCardValue === "^") {
      removeCardFromHand(
        player,
        index,
        player1NeedsToDraw2,
        player2NeedsToDraw2
      )
      setCurrentValue(playedCardValue)
      setCurrentColor(playedCardColor)
      setDiscard([...discard, playedCard])
      setTurnPlayer(turnPlayer === 1 ? 1 : 2)
    }
    if (playedCardValue === "+") {
      removeCardFromHand(
        player,
        index,
        player1NeedsToDraw2,
        player2NeedsToDraw2
      )
      setCurrentValue(playedCardValue)
      setCurrentColor(playedCardColor)
      setDiscard([...discard, playedCard])
      drawCards(turnPlayer === 1 ? 2 : 1, 2)
      setTurnPlayer(turnPlayer === 1 ? 1 : 2)
    }
    if (playedCardValue === "_") {
      removeCardFromHand(
        player,
        index,
        player1NeedsToDraw2,
        player2NeedsToDraw2
      )
      setCurrentValue(playedCardValue)
      setCurrentColor(playedCardColor)
      setDiscard([...discard, playedCard])
      setTurnPlayer(turnPlayer === 1 ? 1 : 2)
    }
  }

  const onDrawCardHandler = () => {
    const newCard = drawCards(turnPlayer, 1)
    if (checkCardPlayable(newCard) === false) {
      setTurnPlayer(turnPlayer === 1 ? 2 : 1)
    }
    setDrawButton(0)
  }

  const restart = () => {
    setPhase(0)
    setGameOver(false)
    setWinner("")
    setDeck([])
    setDiscard([])
    setPlayer1([])
    setPlayer2([])
    setCurrentValue("")
    setCurrentColor("")
    setTurnPlayer(0)
    setDrawButton(0)
    setUnoButtonIsPressed(false)
    initializeGame()
  }

  return (
    <main className={`${styles.container} ${styles[`${currentColor}`]}`}>
      {gameOver && (
        <div className={styles.gameOver}>
          <div>{`${gameOver && "GAME OVER!"}`}</div>
          <div>{`${winner} ${winner && "wins!"}`}</div>
          <div className={styles.greenDraw} onClick={restart}>
            Restart
          </div>
        </div>
      )}
      <h1>Turn Player: {turnPlayer}</h1>
      <h1>Cards in deck: {deck.length}</h1>
      <div className={styles.decksContainer}>
        {phase >= 3 && (
          <Image
            src={`/uno/${discard[discard.length - 1]}.png`}
            className={styles.card}
            priority
            width={100}
            height={100}
            alt="deck"
          ></Image>
        )}
        <Image
          src={`/uno/back.png`}
          className={styles.card}
          priority
          width={100}
          height={100}
          alt="deck"
        ></Image>
        {drawButton ? (
          <div className={styles.greenDraw} onClick={onDrawCardHandler}>
            DRAW
          </div>
        ) : null}
      </div>
      <div className={styles.hand}>
        {player2.map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            onClick={() => onCardPlayedHandler(2, card, i)}
            priority
            width={100}
            height={100}
            key={"p2" + i + card}
            data-player="2"
            alt={card}
          ></Image>
        ))}
        {player2.length === 2 && turnPlayer === 2 && (
          <div
            className={styles.greenDraw}
            onClick={() => {
              setUnoButtonIsPressed(!unoButtonIsPressed)
            }}
          >
            UNO
          </div>
        )}
      </div>
      <div className={styles.hand}>
        {player1.map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            onClick={() => onCardPlayedHandler(1, card, i)}
            priority
            width={100}
            height={100}
            key={"p1" + i + card}
            data-player="1"
            alt={card}
          ></Image>
        ))}
        {player1.length === 2 && turnPlayer === 1 && (
          <div
            className={`${
              unoButtonIsPressed ? styles.greyDraw : styles.greenDraw
            }`}
            onClick={() => {
              setUnoButtonIsPressed(!unoButtonIsPressed)
            }}
          >
            UNO
          </div>
        )}
      </div>
    </main>
  )
}
