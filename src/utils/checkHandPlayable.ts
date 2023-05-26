const checkHandPlayable = (
  player: number,
  player1: string[],
  player2: string[],
  currentValue: string,
  currentColor: string
) => {
  if (player === 1) {
    for (let i = 0; i < player1.length; i++) {
      if (
        player1[i][0] === currentValue ||
        player1[i][1] === currentColor ||
        player1[i] === "W=" ||
        player1[i] === "W+"
      ) {
        return true
      }
    }
  }
  if (player === 2) {
    for (let i = 0; i < player2.length; i++) {
      if (
        player2[i][0] === currentValue ||
        player2[i][1] === currentColor ||
        player2[i] === "W=" ||
        player2[i] === "W+"
      ) {
        return true
      }
    }
  }
}

export default checkHandPlayable
