const shuffle = (deck: string[]) => {
  const _deck = [...deck]
  for (let i = 0; i < deck.length - 1; i++) {
    let randomIndex = Math.floor(Math.random() * (i + 1))
    let temp = _deck[i]
    _deck[i] = _deck[randomIndex]
    _deck[randomIndex] = temp
  }
  return _deck
}

export default shuffle
