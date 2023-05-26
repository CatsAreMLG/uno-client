import drawCards from "./drawCards"
import checkCardPlayable from "./checkCardPlayable"
import { SetStateAction } from "react"

const onDrawCardHandler = (
  turnPlayer: number,
  deck: string[],
  currentValue: string,
  currentColor: string,
  player1: string[],
  player2: string[],
  setPlayer1: {
    (value: SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setPlayer2: {
    (value: SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setDeck: { (value: SetStateAction<string[]>): void; (arg0: string[]): void },
  setTurnPlayer: (arg0: number) => void,
  setDrawButton: (arg0: number) => void
) => {
  const newCard = drawCards(
    turnPlayer,
    1,
    deck,
    player1,
    player2,
    setPlayer1,
    setPlayer2,
    setDeck
  )
  if (checkCardPlayable(newCard, currentValue, currentColor) === false) {
    setTurnPlayer(turnPlayer === 1 ? 2 : 1)
  }
  setDrawButton(0)
}
