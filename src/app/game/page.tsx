"use client"

import { useState, useEffect, use } from "react"
import { defaultDeck } from "../../utils/decks"
import styles from "./game.module.css"
import { start } from "repl"

export default function Game() {
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [player1, setPlayer1] = useState([])
  const [player2, setPlayer2] = useState([])
  const [deck, setDeck] = useState([] as string[])
  const [discard, setDiscard] = useState([])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")

  function startGame() {
    setGameOver(false)
    setWinner("")
    setDeck(defaultDeck)
    // shuffleDeck()
    // dealCards()
    // setStartingCard()
    setTurnPlayer(1)
  }

  useEffect(() => {
    startGame()
  }, [])
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
    <main className={styles.container}>
      <div>player 1 hand</div>
      <div>player 2 hand</div>
    </main>
  )
}
