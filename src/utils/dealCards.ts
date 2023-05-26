const dealCards = (
  deck: string[],
  setPlayer1: (arg0: string[]) => void,
  setPlayer2: (arg0: string[]) => void,
  setDeck: (arg0: string[]) => void,
  setPhase: (arg0: number) => void
) => {
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

export default dealCards
