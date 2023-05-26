"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import * as io from "socket.io-client"
import { useSound } from "use-sound"
import {
  shuffle,
  dealCards,
  defaultDeck,
  initializeGame,
  setStartingCard,
  checkHandPlayable,
  checkGameOver,
  checkWinner,
  toggleChatBox,
  sendMessage,
} from "../../../utils"
import styles from "./game.module.css"

const bgMusic = "/uno/sounds/game-bg-music.mp3"
const unoSound = "/uno/sounds/uno-sound.mp3"
const shufflingSound = "/uno/sounds/shuffling-cards-1.mp3"
const skipCardSound = "/uno/sounds/skip-sound.mp3"
const draw2CardSound = "/uno/sounds/draw2-sound.mp3"
const wildCardSound = "/uno/sounds/wild-sound.mp3"
const draw4CardSound = "/uno/sounds/draw4-sound.mp3"
const gameOverSound = "/uno/sounds/game-over-sound.mp3"

let socket: io.Socket
let connectionOptions: Partial<io.ManagerOptions & io.SocketOptions>

const ENDPOINT = "http://localhost:5000"

export default function Game({
  params: { slug },
}: {
  params: { slug: string }
}) {
  //initialize socket state
  const [room, setRoom] = useState(slug)
  const [roomFull, setRoomFull] = useState(false)
  const [users, setUsers] = useState([] as any[])
  const [currentUser, setCurrentUser] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([] as any[])

  useEffect(() => {
    connectionOptions = {
      forceNew: true,
      reconnectionAttempts: 10,
      timeout: 10000,
      transports: ["websocket"],
    }
    socket = io.connect(ENDPOINT, connectionOptions)

    console.log("socket", socket)

    socket.emit("join", { room: room }, (error: any) => {
      if (error) setRoomFull(true)
      console.log("room", room)
    })

    //cleanup on component unmount
    return function cleanup() {
      socket.emit("disconnect")
      //shut down connnection instance
      socket.off()
    }
  }, [])

  const [phase, setPhase] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [unoButtonIsPressed, setUnoButtonIsPressed] = useState(false)
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [players, setPlayers] = useState([[], []] as string[][])
  const [deck, setDeck] = useState(defaultDeck as string[])
  const [discard, setDiscard] = useState([] as string[])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")
  const [drawButton, setDrawButton] = useState(0)

  const [isChatBoxHidden, setChatBoxHidden] = useState(true)
  const [isUnoButtonPressed, setUnoButtonPressed] = useState(false)
  const [isSoundMuted, setSoundMuted] = useState(false)
  const [isMusicMuted, setMusicMuted] = useState(true)

  const [playBBgMusic, { pause }] = useSound(bgMusic, { loop: true })
  const [playUnoSound] = useSound(unoSound)
  const [playShufflingSound] = useSound(shufflingSound)
  const [playSkipCardSound] = useSound(skipCardSound)
  const [playDraw2CardSound] = useSound(draw2CardSound)
  const [playWildCardSound] = useSound(wildCardSound)
  const [playDraw4CardSound] = useSound(draw4CardSound)
  const [playGameOverSound] = useSound(gameOverSound)

  //prettier-ignore
  const specials = ["^R","_R","+R","^G","_G","+G","^B","_B","+B","^Y","_Y","+Y","W=","W+",]

  useEffect(() => {
    //shuffle PACK_OF_CARDS array
    const shuffledCards = shuffle(deck)

    //extract first 7 elements to playerDeck
    const player = shuffledCards.splice(0, 7)

    //extract first 7 elements to player2Deck
    const player2 = shuffledCards.splice(0, 7)

    //extract random card from shuffledCards and check if its not an action card
    let startingCardIndex
    while (true) {
      startingCardIndex = Math.floor(Math.random() * 94)
      if (!specials.includes(shuffledCards[startingCardIndex])) break
    }

    //extract the card from that startingCardIndex into the playedCardsPile
    const newDiscard = shuffledCards.splice(startingCardIndex, 1)

    //store all remaining cards into drawCardPile
    const newDeck = shuffledCards

    //send initial state to server
    socket.emit("initGameState", {
      gameOver: false,
      turnPlayer: 0,
      players: [...player, ...player2],
      currentValue: newDiscard[0].charAt(0),
      currentColor: newDiscard[0].charAt(1),
      discard: [...newDiscard],
      deck: [...newDeck],
    })
  }, [])

  useEffect(() => {
    socket.on(
      "initGameState",
      ({
        gameOver,
        turnPlayer,
        players,
        currentValue,
        currentColor,
        discard,
        deck,
      }) => {
        setGameOver(gameOver)
        setTurnPlayer(turnPlayer)
        setPlayers(players)
        setCurrentValue(currentValue)
        setCurrentColor(currentColor)
        setDiscard(discard)
        setDeck(deck)
      }
    )

    socket.on(
      "updateGameState",
      ({
        gameOver,
        winner,
        turnPlayer,
        players,
        currentValue,
        currentColor,
        discard,
        deck,
      }) => {
        gameOver && setGameOver(gameOver)
        gameOver === true && playGameOverSound()
        winner && setWinner(winner)
        turnPlayer && setTurnPlayer(turnPlayer)
        players && setPlayers(players)
        currentValue && setCurrentValue(currentValue)
        currentColor && setCurrentColor(currentColor)
        discard && setDiscard(discard)
        deck && setDeck(deck)
        setUnoButtonPressed(false)
      }
    )

    socket.on("roomData", ({ users }) => {
      setUsers(users)
    })

    socket.on("currentUserData", ({ name }) => {
      setCurrentUser(name)
    })

    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message])

      const chatBody = document.querySelector(".chat-body") as HTMLElement
      chatBody.scrollTop = chatBody.scrollHeight
    })
  }, [])

  const onCardPlayedHandler = (playedCard: string) => {
    const cardPlayedBy = turnPlayer % players.length
    const playedCardValue = playedCard.charAt(0)
    const playedCardColor = playedCard.charAt(1)

    switch (true) {
      case /^\d/.test(playedCardValue): {
        if (
          currentValue === playedCardValue ||
          currentColor === playedCardColor
        ) {
          const removeIndex = players[cardPlayedBy].indexOf(playedCard)
          if (players[cardPlayedBy].length === 2 && !isUnoButtonPressed) {
            alert("Oops! You forgot to press UNO. You drew 2 cards as penalty.")
            const newDeck = [...deck]
            const twoNewCards = newDeck.splice(-2)
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
              ...twoNewCards,
            ]
            !isSoundMuted && playShufflingSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 1,
              discard: [...discard, playedCard],
              players: [
                ...players.slice(0, cardPlayedBy),
                newPlayerHand,
                ...players.slice(cardPlayedBy + 1),
              ],
              currentValue: playedCardValue,
              currentColor: playedCardColor,
              deck: [...newDeck],
            })
          } else {
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
            ]
            !isSoundMuted && playShufflingSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 1,
              discard: [...discard, playedCard],
              players: [
                ...players.slice(0, cardPlayedBy),
                newPlayerHand,
                ...players.slice(cardPlayedBy + 1),
              ],
              currentValue: playedCardValue,
              currentColor: playedCardColor,
            })
          }
        } else {
          alert("Invalid move! Please try again.")
        }
        break
      }
      //if card played was a skip card
      case playedCard.charAt(0) === "^": {
        if (currentValue === "^" || currentColor === playedCardColor) {
          const removeIndex = players[cardPlayedBy].indexOf(playedCard)
          if (players[cardPlayedBy].length === 2 && !isUnoButtonPressed) {
            alert("Oops! You forgot to press UNO. You drew 2 cards as penalty.")
            const newDeck = [...deck]
            const twoNewCards = newDeck.splice(-2)
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
              ...twoNewCards,
            ]
            !isSoundMuted && playSkipCardSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: [
                ...players.slice(0, cardPlayedBy),
                newPlayerHand,
                ...players.slice(cardPlayedBy + 1),
              ],
              currentValue: playedCardValue,
              currentColor: playedCardColor,
              deck: [...newDeck],
            })
          } else {
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
            ]
            !isSoundMuted && playSkipCardSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: [
                ...players.slice(0, cardPlayedBy),
                newPlayerHand,
                ...players.slice(cardPlayedBy + 1),
              ],
              currentValue: playedCardValue,
              currentColor: playedCardColor,
            })
          }
        } else {
          alert("Invalid move! Please try again.")
        }
        break
      }
      //if card played was a draw 2 card
      case playedCard.charAt(0) === "+": {
        if (currentValue === "+" || currentColor === playedCardColor) {
          const removeIndex = players[cardPlayedBy].indexOf(playedCard)
          const newDeck = [...deck]
          const twoNewCards = newDeck.splice(-2)
          const twoNewCardsX = newDeck.splice(-2)
          const nextPlayer = (turnPlayer + 1) % players.length
          if (players[cardPlayedBy].length === 2 && !isUnoButtonPressed) {
            alert("Oops! You forgot to press UNO. You drew 2 cards as penalty.")
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
              ...twoNewCards,
            ]
            const newNextPlayerHand = [...players[nextPlayer], ...twoNewCardsX]
            !isSoundMuted && playDraw2CardSound()
            const newPlayers = [...players]
            newPlayers[cardPlayedBy] = newPlayerHand
            newPlayers[nextPlayer] = newNextPlayerHand
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: newPlayers,
              currentValue: playedCardValue,
              currentColor: playedCardColor,
              deck: [...newDeck],
            })
          } else {
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
            ]
            const newNextPlayerHand = [...players[nextPlayer], ...twoNewCardsX]
            const newPlayers = [...players]
            newPlayers[cardPlayedBy] = newPlayerHand
            newPlayers[nextPlayer] = newNextPlayerHand
            !isSoundMuted && playDraw2CardSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: newPlayers,
              currentValue: playedCardValue,
              currentColor: playedCardColor,
              deck: [...newDeck],
            })
          }
        } else {
          alert("Invalid move! Please try again.")
        }
        break
      }
      //if card played was a wild card
      case playedCard === "W=": {
        const chosenColor = prompt(
          "Choose a new color: (R/G/B/Y)",
          "R"
        )?.toUpperCase()
        const removeIndex = players[cardPlayedBy].indexOf(playedCard)
        if (players[cardPlayedBy].length === 2 && !isUnoButtonPressed) {
          alert("Oops! You forgot to press UNO. You drew 2 cards as penalty.")
          const newDeck = [...deck]
          const twoNewCards = newDeck.splice(-2)
          const newPlayerHand = [
            ...players[cardPlayedBy].slice(0, removeIndex),
            ...players[cardPlayedBy].slice(removeIndex + 1),
            ...twoNewCards,
          ]
          !isSoundMuted && playWildCardSound()
          socket.emit("updateGameState", {
            gameOver: checkGameOver(players[cardPlayedBy]),
            winner: checkWinner(
              players[cardPlayedBy],
              `Player ${cardPlayedBy + 1}`
            ),
            turnPlayer: turnPlayer + 1,
            discard: [...discard, playedCard],
            players: [
              ...players.slice(0, cardPlayedBy),
              newPlayerHand,
              ...players.slice(cardPlayedBy + 1),
            ],
            currentValue: playedCardValue,
            currentColor: chosenColor,
            deck: [...newDeck],
          })
        } else {
          const newPlayerHand = [
            ...players[cardPlayedBy].slice(0, removeIndex),
            ...players[cardPlayedBy].slice(removeIndex + 1),
          ]
          !isSoundMuted && playWildCardSound()
          socket.emit("updateGameState", {
            gameOver: checkGameOver(players[cardPlayedBy]),
            winner: checkWinner(
              players[cardPlayedBy],
              `Player ${cardPlayedBy + 1}`
            ),
            turnPlayer: turnPlayer + 1,
            discard: [...discard, playedCard],
            players: [
              ...players.slice(0, cardPlayedBy),
              newPlayerHand,
              ...players.slice(cardPlayedBy + 1),
            ],
            currentValue: playedCardValue,
            currentColor: chosenColor,
          })
          const newPlayers = [...players]
          newPlayers[cardPlayedBy] = newPlayerHand
        }
        break
      }
      //if card played was a draw 4 wild card
      case playedCard === "W+":
        {
          const chosenColor = prompt(
            "Choose a new color: (R/G/B/Y)",
            "R"
          )?.toUpperCase()
          const removeIndex = players[cardPlayedBy].indexOf(playedCard)
          const newDeck = [...deck]
          const twoNewCards = newDeck.splice(-2)
          const fourNewCards = newDeck.splice(-4)
          const nextPlayer = (turnPlayer + 1) % players.length
          if (players[cardPlayedBy].length === 2 && !isUnoButtonPressed) {
            alert("Oops! You forgot to press UNO. You drew 2 cards as penalty.")
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
              ...twoNewCards,
            ]
            const newNextPlayerHand = [...players[nextPlayer], ...fourNewCards]
            const _players = [...players]
            _players[cardPlayedBy] = newPlayerHand
            _players[nextPlayer] = newNextPlayerHand
            !isSoundMuted && playDraw4CardSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: _players,
              currentValue: playedCardValue,
              currentColor: chosenColor,
              deck: [...newDeck],
            })
          } else {
            const newPlayerHand = [
              ...players[cardPlayedBy].slice(0, removeIndex),
              ...players[cardPlayedBy].slice(removeIndex + 1),
            ]
            const newNextPlayerHand = [...players[nextPlayer], ...fourNewCards]
            const _players = [...players]
            _players[cardPlayedBy] = newPlayerHand
            _players[nextPlayer] = newNextPlayerHand
            !isSoundMuted && playDraw4CardSound()
            socket.emit("updateGameState", {
              gameOver: checkGameOver(players[cardPlayedBy]),
              winner: checkWinner(
                players[cardPlayedBy],
                `Player ${cardPlayedBy + 1}`
              ),
              turnPlayer: turnPlayer + 2,
              discard: [...discard, playedCard],
              players: _players,
              currentValue: playedCardValue,
              currentColor: chosenColor,
              deck: [...newDeck],
            })
            let newPlayers = [...players]
            newPlayers[cardPlayedBy] = newPlayerHand
          }
        }
        break
    }
  }

  return (
    <main className={`${styles.container} ${styles[`${currentColor}`]}`}>
      {gameOver && (
        <div className={styles.gameOver}>
          <div>{`${gameOver && "GAME OVER!"}`}</div>
          <div>{`${winner} ${winner && "wins!"}`}</div>
        </div>
      )}
      <h1>Turn Player: {turnPlayer}</h1>
      <h1>Cards in deck: {deck.length}</h1>
      <div className={styles.decksContainer}>
        {discard && discard.length > 0 && (
          <Image
            src={`/uno/${discard[discard.length - 1]}.png`}
            className={styles.card}
            priority
            width={100}
            height={100}
            alt="discard"
          ></Image>
        )}
        <Image
          src={`/uno/Back.png`}
          className={styles.card}
          priority
          width={100}
          height={100}
          alt="deck"
        ></Image>
        {drawButton ? (
          <div
            className={styles.greenDraw}
            // onClick={() =>
            //   onDrawCardHandler(
            //     turnPlayer,
            //     deck,
            //     currentValue,
            //     currentColor,
            //     player,
            //     player2,
            //     setPlayer1,
            //     setPlayer2,
            //     setDeck,
            //     setTurnPlayer,
            //     setDrawButton
            //   )
            // }
          >
            DRAW
          </div>
        ) : null}
      </div>
      <div className={styles.hand}>
        {players[1].map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            // onClick={() =>
            //   onCardPlayedHandler(
            //     2,
            //     card,
            //     i,
            //     unoButtonIsPressed,
            //     turnPlayer,
            //     currentValue,
            //     currentColor,
            //     player,
            //     player2,
            //     deck,
            //     discard,
            //     setPlayer1,
            //     setPlayer2,
            //     setDeck,
            //     setDiscard,
            //     setCurrentValue,
            //     setCurrentColor,
            //     setTurnPlayer
            //   )
            // }
            priority
            width={100}
            height={100}
            key={"p2" + i + card}
            data-player="2"
            alt={card}
          ></Image>
        ))}
        {players[1].length === 2 && turnPlayer === 2 && (
          <div
            className={styles.greenDraw}
            onClick={() => {
              setUnoButtonIsPressed(!unoButtonIsPressed)
            }}
          >
            UNO
          </div>
        )}
      </div>
      <div className={styles.hand}>
        {players[0].map((card, i) => (
          <Image
            src={`/uno/${card}.png`}
            className={styles.card}
            // onClick={() =>
            //   onCardPlayedHandler(
            //     1,
            //     card,
            //     i,
            //     unoButtonIsPressed,
            //     turnPlayer,
            //     currentValue,
            //     currentColor,
            //     player,
            //     player2,
            //     deck,
            //     discard,
            //     setPlayer1,
            //     setPlayer2,
            //     setDeck,
            //     setDiscard,
            //     setCurrentValue,
            //     setCurrentColor,
            //     setTurnPlayer
            //   )
            // }
            priority
            width={100}
            height={100}
            key={"p1" + i + card}
            data-player="1"
            alt={card}
          ></Image>
        ))}
        {players[0].length === 2 && turnPlayer === 1 && (
          <div
            className={`${
              unoButtonIsPressed ? styles.greyDraw : styles.greenDraw
            }`}
            onClick={() => {
              setUnoButtonIsPressed(!unoButtonIsPressed)
            }}
          >
            UNO
          </div>
        )}
      </div>
    </main>
  )
}
