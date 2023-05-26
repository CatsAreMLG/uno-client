import removeCardFromHand from "./removeCardFromHand"
import drawCards from "./drawCards"

const onCardPlayedHandler = (
  player: number,
  playedCard: string,
  index: number,
  unoButtonIsPressed: boolean,
  turnPlayer: number,
  currentValue: string,
  currentColor: string,
  player1: string[],
  player2: string[],
  deck: string[],
  discard: string[],
  setPlayer1: {
    (value: React.SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setPlayer2: {
    (value: React.SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setDeck: {
    (value: React.SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setDiscard: {
    (value: React.SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setCurrentValue: {
    (value: React.SetStateAction<string>): void
    (arg0: string): void
  },
  setCurrentColor: {
    (value: React.SetStateAction<string>): void
    (arg0: string): void
  },
  setTurnPlayer: {
    (value: React.SetStateAction<number>): void
    (arg0: number): void
  }
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
      player1,
      player2,
      deck,
      player,
      index,
      player1NeedsToDraw2,
      player2NeedsToDraw2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setCurrentValue(playedCardValue)
    setCurrentColor(prompt("Choose a color (R,G,B,Y)") || "R")
    setDiscard([...discard, playedCard])
    if (playedCardColor === "+") {
      setTurnPlayer(turnPlayer === 1 ? 1 : 2)
      drawCards(
        turnPlayer === 1 ? 2 : 1,
        4,
        deck,
        player1,
        player2,
        setPlayer1,
        setPlayer2,
        setDeck
      )
    } else {
      setTurnPlayer(turnPlayer === 1 ? 2 : 1)
    }
  }
  if (playedCardValue !== currentValue && playedCardColor !== currentColor)
    return
  if (/^\d/.test(playedCardValue)) {
    removeCardFromHand(
      player1,
      player2,
      deck,
      player,
      index,
      player1NeedsToDraw2,
      player2NeedsToDraw2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setCurrentValue(playedCardValue)
    setCurrentColor(playedCardColor)
    setDiscard([...discard, playedCard])
    setTurnPlayer(turnPlayer === 1 ? 2 : 1)
  }
  if (playedCardValue === "^") {
    removeCardFromHand(
      player1,
      player2,
      deck,
      player,
      index,
      player1NeedsToDraw2,
      player2NeedsToDraw2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setCurrentValue(playedCardValue)
    setCurrentColor(playedCardColor)
    setDiscard([...discard, playedCard])
    setTurnPlayer(turnPlayer === 1 ? 1 : 2)
  }
  if (playedCardValue === "+") {
    removeCardFromHand(
      player1,
      player2,
      deck,
      player,
      index,
      player1NeedsToDraw2,
      player2NeedsToDraw2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setCurrentValue(playedCardValue)
    setCurrentColor(playedCardColor)
    setDiscard([...discard, playedCard])
    drawCards(
      turnPlayer === 1 ? 2 : 1,
      2,
      deck,
      player1,
      player2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setTurnPlayer(turnPlayer === 1 ? 1 : 2)
  }
  if (playedCardValue === "_") {
    removeCardFromHand(
      player1,
      player2,
      deck,
      player,
      index,
      player1NeedsToDraw2,
      player2NeedsToDraw2,
      setPlayer1,
      setPlayer2,
      setDeck
    )
    setCurrentValue(playedCardValue)
    setCurrentColor(playedCardColor)
    setDiscard([...discard, playedCard])
    setTurnPlayer(turnPlayer === 1 ? 1 : 2)
  }
}

export default onCardPlayedHandler
