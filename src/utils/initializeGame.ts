import shuffle from "./shuffle"

const initializeGame = (
  deck: string[],
  setGameOver: {
    (value: React.SetStateAction<boolean>): void
    (arg0: boolean): void
  },
  setWinner: {
    (value: React.SetStateAction<string>): void
    (arg0: string): void
  },
  setDeck: {
    (value: React.SetStateAction<string[]>): void
    (arg0: string[]): void
  },
  setPhase: {
    (value: React.SetStateAction<number>): void
    (arg0: number): void
  }
) => {
  setGameOver(false)
  setWinner("")
  setDeck(shuffle(deck))
  setPhase(1)
}

export default initializeGame
