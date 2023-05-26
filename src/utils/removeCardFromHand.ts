const removeCardFromHand = (
  player1: string[],
  player2: string[],
  deck: string[],
  player: number,
  index: number,
  player1NeedsToDraw2: boolean,
  player2NeedsToDraw2: boolean,
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

export default removeCardFromHand
