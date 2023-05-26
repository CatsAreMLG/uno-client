const checkCardPlayable = (
  newCard: string,
  currentValue: string,
  currentColor: string
) => {
  return (
    newCard[0] === currentValue ||
    newCard[1] === currentColor ||
    newCard === "W=" ||
    newCard === "W+"
  )
}

export default checkCardPlayable
