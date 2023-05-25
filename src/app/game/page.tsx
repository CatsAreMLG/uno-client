"use client"

import Image from "next/image"
import { useState, useEffect, use } from "react"
import { defaultDeck } from "../../utils/decks"
import shuffle from "../../utils/shuffle"
import styles from "./game.module.css"

export default function Game() {
  const [phase, setPhase] = useState("init")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [player1, setPlayer1] = useState([] as string[])
  const [player2, setPlayer2] = useState([] as string[])
  const [deck, setDeck] = useState([] as string[])
  const [discard, setDiscard] = useState([] as string[])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")

  function initializeGame() {
    setGameOver(false)
    setWinner("")
    setDeck(shuffleDeck(defaultDeck))
    setPhase("deal")
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
    setPhase("dealt")
  }

  //prettier-ignore
  const setStartingCard = () => {
    let _deck = [...deck]
    let _discard = [...discard]
    let startingCard: string
    console.log("deck: ",_deck)

    do {
      startingCard = _deck.pop() || ""
      console.log("startingCard: ", startingCard)
      _discard.push(startingCard)
    } while (!/^\d/.test(startingCard))

    setDiscard(_discard)
    setDeck(_deck)
    setCurrentValue(startingCard[0])
    setCurrentColor(startingCard[1])
    setPhase("begin")
  }

  useEffect(() => {
    if (phase === "init") initializeGame()
  }, [])

  useEffect(() => {
    if (phase === "deal") dealCards()
    if (phase === "dealt") setStartingCard()
  }, [deck])

  //prettier-ignore
  const onCardPlayedHandler = (playedCard:string) => {
    // check if player is turn player
    // check if card is playable
    // check if card is wild
        // check if card is draw 4
    // check if card is draw 2
    // check if card is skip
    // check if card is reverse

    // if card is number card
        // remove card from player hand
        // set current card
        // set current color
        // set turn player +1
    // if card is skip card
        // remove card from player hand
        // set current card
        // set current color
        // set turn player +2
    // if card is draw 2 card
        // remove card from player hand
        // set current card
        // set current color
        // next player draws 2 cards
        // set turn player +2
    // if card is reverse card
        // remove card from player hand
        // set current card
        // set current color
        // set turn player -1
    // if card is wild card
        // remove card from player hand
        // set current card
        // set current color
        // else set turn player +1
        // if card is draw 4
            // next player draws 4 cards
            // set turn player +1
    // if card is not playable
        // do nothing
    
    // check if player has won
        // set winner
        // set game over
    // check if player has uno
  }

  //prettier-ignore
  const onDrawCardHandler = () => {
    // add card to player hand
    // if card is not playable
        // set turn player +1
  }

  return (
    <main className={`${styles.container} ${styles[`${currentColor}`]}`}>
      <h1>Cards in deck: {deck.length}</h1>
      <div className={styles.decksContainer}>
        <Image
          src={`/uno/${discard[0]}.png`}
          className={styles.card}
          priority
          width={100}
          height={100}
          alt="deck"
        ></Image>
        <Image
          src={`/uno/back.png`}
          className={styles.card}
          priority
          width={100}
          height={100}
          alt="deck"
        ></Image>
      </div>
      <div className={styles.hand}>
        {player2.map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            priority
            width={100}
            height={100}
            key={"p2" + i + card}
            alt={card}
          ></Image>
        ))}
      </div>
      <div className={styles.hand}>
        {player1.map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            priority
            width={100}
            height={100}
            key={"p1" + i + card}
            alt={card}
          ></Image>
        ))}
      </div>
    </main>
  )
}
