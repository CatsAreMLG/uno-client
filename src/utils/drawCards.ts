const drawCards = (
  player: number,
  amount: number,
  deck: string[],
  player1: string[],
  player2: string[],
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
  }
) => {
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

export default drawCards
