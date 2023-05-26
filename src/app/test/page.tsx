"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import io from "socket.io-client"
import { useSound } from "use-sound"

import {
  dealCards,
  defaultDeck,
  initializeGame,
  setStartingCard,
  checkHandPlayable,
  onCardPlayedHandler,
  onDrawCardHandler,
} from "../../utils"

import styles from "./game.module.css"

const bgMusic = "/uno/sounds/game-bg-music.mp3"
const unoSound = "/uno/sounds/uno-sound.mp3"
const shufflingSound = "/uno/sounds/shuffling-cards-1.mp3"
const skipCardSound = "/uno/sounds/skip-sound.mp3"
const draw2CardSound = "/uno/sounds/draw2-sound.mp3"
const wildCardSound = "/uno/sounds/wild-sound.mp3"
const draw4CardSound = "/uno/sounds/draw4-sound.mp3"
const gameOverSound = "/uno/sounds/game-over-sound.mp3"

let socket
const ENDPOINT = "http://localhost:5000"

export default function Game() {
  const [phase, setPhase] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [unoButtonIsPressed, setUnoButtonIsPressed] = useState(false)
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [player1, setPlayer1] = useState([] as string[])
  const [player2, setPlayer2] = useState([] as string[])
  const [deck, setDeck] = useState(defaultDeck as string[])
  const [discard, setDiscard] = useState([] as string[])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")
  const [drawButton, setDrawButton] = useState(0)

  useEffect(() => {
    if (phase === 0)
      initializeGame(deck, setGameOver, setWinner, setDeck, setPhase)
  }, [])

  useEffect(() => {
    if (phase === 1) dealCards(deck, setPlayer1, setPlayer2, setDeck, setPhase)
    if (phase === 2)
      setStartingCard(
        deck,
        discard,
        setDiscard,
        setDeck,
        setCurrentValue,
        setCurrentColor,
        setTurnPlayer,
        setPhase
      )
  }, [deck])

  useEffect(() => {
    if (phase === 3) {
      if (player1.length === 0) {
        setWinner("Player 1")
        setPhase(4)
        setGameOver(true)
      }
      if (player2.length === 0) {
        setWinner("Player 2")
        setPhase(4)
        setGameOver(true)
      }
      if (
        !checkHandPlayable(
          turnPlayer,
          player1,
          player2,
          currentValue,
          currentColor
        )
      ) {
        setDrawButton(turnPlayer)
      }
    }
  }, [player1, player2])

  useEffect(() => {
    if (phase === 3) {
      if (
        !checkHandPlayable(
          turnPlayer,
          player1,
          player2,
          currentValue,
          currentColor
        )
      ) {
        setDrawButton(turnPlayer)
      } else {
        setDrawButton(0)
      }
    }
  }, [turnPlayer])

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
    initializeGame(deck, setGameOver, setWinner, setDeck, setPhase)
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
          src={`/uno/Back.png`}
          className={styles.card}
          priority
          width={100}
          height={100}
          alt="deck"
        ></Image>
        {drawButton ? (
          <div
            className={styles.greenDraw}
            onClick={() =>
              onDrawCardHandler(
                turnPlayer,
                deck,
                currentValue,
                currentColor,
                player1,
                player2,
                setPlayer1,
                setPlayer2,
                setDeck,
                setTurnPlayer,
                setDrawButton
              )
            }
          >
            DRAW
          </div>
        ) : null}
      </div>
      <div className={styles.hand}>
        {player2.map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            onClick={() =>
              onCardPlayedHandler(
                2,
                card,
                i,
                unoButtonIsPressed,
                turnPlayer,
                currentValue,
                currentColor,
                player1,
                player2,
                deck,
                discard,
                setPlayer1,
                setPlayer2,
                setDeck,
                setDiscard,
                setCurrentValue,
                setCurrentColor,
                setTurnPlayer
              )
            }
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
            onClick={() =>
              onCardPlayedHandler(
                1,
                card,
                i,
                unoButtonIsPressed,
                turnPlayer,
                currentValue,
                currentColor,
                player1,
                player2,
                deck,
                discard,
                setPlayer1,
                setPlayer2,
                setDeck,
                setDiscard,
                setCurrentValue,
                setCurrentColor,
                setTurnPlayer
              )
            }
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
