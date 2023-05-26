const setStartingCard = (
  deck: string[],
  discard: string[],
  setDiscard: {
    (value: React.SetStateAction<string[]>): void
    (arg0: any[]): void
  },
  setDeck: {
    (value: React.SetStateAction<string[]>): void
    (arg0: any[]): void
  },
  setCurrentValue: {
    (value: React.SetStateAction<string>): void
    (arg0: any): void
  },
  setCurrentColor: {
    (value: React.SetStateAction<string>): void
    (arg0: any): void
  },
  setTurnPlayer: {
    (value: React.SetStateAction<number>): void
    (arg0: number): void
  },
  setPhase: {
    (value: React.SetStateAction<number>): void
    (arg0: number): void
  }
) => {
  let _deck = [...deck]
  let _discard = [...discard]
  let startingCard
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

export default setStartingCard
