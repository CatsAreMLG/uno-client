"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
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

const ENDPOINT: string = process.env.SERVER || "https://uno-server.shrimp.cx/"

export default function Game({
  params: { slug },
}: {
  params: { slug: string }
}) {
  //initialize socket state
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ])
  const [room, setRoom] = useState(slug)
  const [roomFull, setRoomFull] = useState(false)
  const [users, setUsers] = useState([] as any[])
  const [currentUser, setCurrentUser] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([] as any[])

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight])
    }

    window.addEventListener("resize", handleWindowResize)

    return () => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [])

  useEffect(() => {
    connectionOptions = {
      forceNew: true,
      reconnectionAttempts: 10,
      timeout: 10000,
      transports: ["websocket"],
    }
    socket = io.connect(ENDPOINT, connectionOptions)

    socket.emit("join", { room: room }, (error: any) => {
      if (error) setRoomFull(true)
    })

    //cleanup on component unmount
    return function cleanup() {
      socket.emit("dis")
      //shut down connnection instance
      socket.off()
    }
  }, [])

  const [phase, setPhase] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState("")
  const [turnPlayer, setTurnPlayer] = useState(0)
  const [players, setPlayers] = useState([[], []] as string[][])
  const [deck, setDeck] = useState(defaultDeck as string[])
  const [discard, setDiscard] = useState([] as string[])
  const [currentValue, setCurrentValue] = useState("")
  const [currentColor, setCurrentColor] = useState("")

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
    const shuffledCards = shuffle(deck)
    const player = shuffledCards.splice(0, 7)
    const player2 = shuffledCards.splice(0, 7)
    let startingCardIndex
    while (true) {
      startingCardIndex = Math.floor(Math.random() * 94)
      if (!specials.includes(shuffledCards[startingCardIndex])) break
    }
    const newDiscard = shuffledCards.splice(startingCardIndex, 1)
    const newDeck = shuffledCards
    socket.emit("initGameState", {
      gameOver: false,
      turnPlayer: 0,
      players: [[...player], [...player2]],
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

  const onCardPlayedHandler = (playedCard: string, player: number) => {
    const cardPlayedBy = turnPlayer % players.length
    const playedCardValue = playedCard.charAt(0)
    const playedCardColor = playedCard.charAt(1)

    // test if card is played by the current player
    if (player !== turnPlayer % players.length) return

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
        }
        break
      }
      //if card played was a reverse card
      case playedCard.charAt(0) === "_": {
        if (currentValue === "_" || currentColor === playedCardColor) {
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

  const onCardDrawnHandler = () => {
    const cardDrawnBy = turnPlayer % players.length

    const _deck = [...deck]
    const cardDrawn = _deck.pop()

    const valueOfDrawnCard = cardDrawn?.charAt(0)
    const colorOfDrawnCard = cardDrawn?.charAt(1)

    // check if card is playable
    if (
      valueOfDrawnCard !== currentValue &&
      colorOfDrawnCard !== currentColor &&
      cardDrawn !== "W=" &&
      cardDrawn !== "W+"
    ) {
      !isSoundMuted && playShufflingSound()
      //send new state to server
      socket.emit("updateGameState", {
        turnPlayer: turnPlayer + 1,
        players: [
          ...players.slice(0, cardDrawnBy),
          [...players[cardDrawnBy], cardDrawn],
          ...players.slice(cardDrawnBy + 1),
        ],
        deck: [..._deck],
      })
    } else {
      !isSoundMuted && playShufflingSound()
      //send new state to server
      socket.emit("updateGameState", {
        players: [
          ...players.slice(0, cardDrawnBy),
          [...players[cardDrawnBy], cardDrawn],
          ...players.slice(cardDrawnBy + 1),
        ],
        deck: [..._deck],
      })
    }
  }

  const calculateHandWidth = (handLength: number) => {
    let cardWidth = 96
    let totalCardWidth = cardWidth * handLength
    let overlap = 0
    if (totalCardWidth > windowSize[0] - 50) {
      overlap = (totalCardWidth - (windowSize[0] - 50)) / handLength
      return overlap
    }
    return 0
  }

  return (
    <div className={`Game backgroundColorR backgroundColor${currentColor}`}>
      {!roomFull ? (
        <>
          <div className="topInfo">
            <div className="logo">
              <Image
                src={"/uno/logo.png"}
                className="logoImage"
                width="200"
                height="200"
                alt="logo"
              />
            </div>
            <h1>Game Code: {room}</h1>
            <span className="sounds-container">
              <button
                className="game-button green"
                onClick={() => setSoundMuted(!isSoundMuted)}
              >
                {isSoundMuted ? (
                  <span className="material-icons">Unmute Sounds</span>
                ) : (
                  <span className="material-icons">Mute Sounds</span>
                )}
              </button>
              <button
                className="game-button green"
                onClick={() => {
                  if (isMusicMuted) playBBgMusic()
                  else pause()
                  setMusicMuted(!isMusicMuted)
                }}
              >
                {isMusicMuted ? (
                  <span className="material-icons">Unmute music</span>
                ) : (
                  <span className="material-icons">Mute Music</span>
                )}
              </button>
            </span>
          </div>

          {/* PLAYER LEFT MESSAGES */}
          {users.length === 1 && currentUser === "Player 2" && (
            <h1 className="topInfoText">Player 1 has left the game.</h1>
          )}
          {users.length === 1 && currentUser === "Player 1" && (
            <h1 className="topInfoText">
              Waiting for Player 2 to join the game.
            </h1>
          )}

          {users.length === 2 && (
            <>
              {gameOver ? (
                <div>
                  {winner !== "" && (
                    <div className="winner">
                      <h1>GAME OVER</h1>
                      <h2>{winner} wins!</h2>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* PLAYER 1 VIEW */}
                  {currentUser === "Player 1" && (
                    <>
                      <div
                        className="player2Deck"
                        style={{ pointerEvents: "none" }}
                      >
                        {players[1] &&
                          players[1].map((item, i) => (
                            <Image
                              key={i}
                              className="Card"
                              style={{
                                marginLeft: `-${calculateHandWidth(
                                  players[0].length
                                )}px`,
                              }}
                              onClick={() => onCardPlayedHandler(item, 0)}
                              src={`/uno/Back.png`}
                              width="220"
                              height="350"
                              alt="Card back"
                            />
                          ))}
                        {turnPlayer % players.length === 1 && (
                          <div className="loader">Loading...</div>
                        )}
                      </div>
                      <br />
                      <div
                        className="middleInfo"
                        style={{
                          pointerEvents:
                            turnPlayer % players.length === 1 ? "none" : "auto",
                        }}
                      >
                        <button
                          className="game-button"
                          disabled={turnPlayer % players.length !== 0}
                          onClick={onCardDrawnHandler}
                        >
                          DRAW CARD
                        </button>
                        {discard && discard.length > 0 && (
                          <Image
                            className="Card"
                            src={`/uno/${discard[discard.length - 1]}.png`}
                            width="220"
                            height="350"
                            alt={`Card ${discard[discard.length - 1]}`}
                          />
                        )}
                        <button
                          className="game-button orange"
                          disabled={players[0].length !== 2}
                          onClick={() => {
                            setUnoButtonPressed(!isUnoButtonPressed)
                            playUnoSound()
                          }}
                        >
                          UNO
                        </button>
                      </div>
                      <br />
                      <div
                        className="player1Deck"
                        style={{
                          pointerEvents:
                            turnPlayer % players.length !== 0 ? "none" : "auto",
                        }}
                      >
                        {players[0] &&
                          players[0].map((item, i) => (
                            <Image
                              key={i}
                              className="Card"
                              style={{
                                marginRight: `-${calculateHandWidth(
                                  players[0].length
                                )}px`,
                              }}
                              onClick={() => onCardPlayedHandler(item, 0)}
                              src={`/uno/${item}.png`}
                              width="220"
                              height="350"
                              alt={`Card ${item}`}
                            />
                          ))}
                      </div>
                      <div className="chatBoxWrapper">
                        <div className="chat-box chat-box-player1">
                          <div className="chat-head">
                            <h2>Chat Box</h2>
                            {!isChatBoxHidden ? (
                              <span
                                onClick={() =>
                                  toggleChatBox(
                                    isChatBoxHidden,
                                    setChatBoxHidden
                                  )
                                }
                                className="material-icons"
                              >
                                v
                              </span>
                            ) : (
                              <span
                                onClick={() =>
                                  toggleChatBox(
                                    isChatBoxHidden,
                                    setChatBoxHidden
                                  )
                                }
                                className="material-icons"
                              >
                                ^
                              </span>
                            )}
                          </div>
                          <div className="chat-body">
                            <div className="msg-insert">
                              {messages.map((msg) => {
                                if (msg.user === "Player 2")
                                  return (
                                    <div className="msg-receive">
                                      {msg.text}
                                    </div>
                                  )
                                if (msg.user === "Player 1")
                                  return (
                                    <div className="msg-send">{msg.text}</div>
                                  )
                              })}
                            </div>
                            <div className="chat-text">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(event) =>
                                  setMessage(event.target.value)
                                }
                                onKeyDown={(event) =>
                                  event.key === "Enter" &&
                                  sendMessage(
                                    event,
                                    socket,
                                    message,
                                    setMessage
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>{" "}
                    </>
                  )}

                  {/* PLAYER 2 VIEW */}
                  {currentUser === "Player 2" && (
                    <>
                      <div
                        className="player1Deck"
                        style={{ pointerEvents: "none" }}
                      >
                        {players[0] &&
                          players[0].map((item, i) => (
                            <Image
                              key={i}
                              className="Card"
                              style={{
                                marginRight: `-${calculateHandWidth(
                                  players[0].length
                                )}px`,
                              }}
                              onClick={() => onCardPlayedHandler(item, 1)}
                              src={`/uno/Back.png`}
                              width="220"
                              height="350"
                              alt="Card back"
                            />
                          ))}
                        {turnPlayer % players.length === 0 && (
                          <div className="loader">Loading...</div>
                        )}
                      </div>
                      <br />
                      <div
                        className="middleInfo"
                        style={{
                          pointerEvents:
                            turnPlayer % players.length === 0 ? "none" : "auto",
                        }}
                      >
                        <button
                          className="game-button"
                          disabled={turnPlayer % players.length !== 1}
                          onClick={onCardDrawnHandler}
                        >
                          DRAW CARD
                        </button>
                        {discard && discard.length > 0 && (
                          <Image
                            className="Card"
                            src={`/uno/${discard[discard.length - 1]}.png`}
                            width="220"
                            height="350"
                            alt={`Card ${discard[discard.length - 1]}`}
                          />
                        )}
                        <button
                          className="game-button orange"
                          disabled={players[1].length !== 2}
                          onClick={() => {
                            setUnoButtonPressed(!isUnoButtonPressed)
                            playUnoSound()
                          }}
                        >
                          UNO
                        </button>
                      </div>
                      <br />
                      <div
                        className="player2Deck"
                        style={{
                          pointerEvents:
                            turnPlayer % players.length === 0 ? "none" : "auto",
                        }}
                      >
                        {players[1].map((item, i) => (
                          <Image
                            key={i}
                            className="Card"
                            style={{
                              marginLeft: `-${calculateHandWidth(
                                players[0].length
                              )}px`,
                            }}
                            onClick={() => onCardPlayedHandler(item, 1)}
                            src={`/uno/${item}.png`}
                            width="220"
                            height="350"
                            alt={`Card ${item}`}
                          />
                        ))}
                      </div>
                      <div className="chatBoxWrapper">
                        <div className="chat-box chat-box-player2">
                          <div className="chat-head">
                            <h2>Chat Box</h2>
                            {!isChatBoxHidden ? (
                              <span
                                onClick={() =>
                                  toggleChatBox(
                                    isChatBoxHidden,
                                    setChatBoxHidden
                                  )
                                }
                                className="material-icons"
                              >
                                v
                              </span>
                            ) : (
                              <span
                                onClick={() =>
                                  toggleChatBox(
                                    isChatBoxHidden,
                                    setChatBoxHidden
                                  )
                                }
                                className="material-icons"
                              >
                                ^
                              </span>
                            )}
                          </div>
                          <div className="chat-body">
                            <div className="msg-insert">
                              {messages.map((msg) => {
                                if (msg.user === "Player 1")
                                  return (
                                    <div className="msg-receive">
                                      {msg.text}
                                    </div>
                                  )
                                if (msg.user === "Player 2")
                                  return (
                                    <div className="msg-send">{msg.text}</div>
                                  )
                              })}
                            </div>
                            <div className="chat-text">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(event) =>
                                  setMessage(event.target.value)
                                }
                                onKeyDown={(event) =>
                                  event.key === "Enter" &&
                                  sendMessage(
                                    event,
                                    socket,
                                    message,
                                    setMessage
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <h1>Room full</h1>
      )}

      <br />
      <a href="/">
        <button className="game-button red">QUIT</button>
      </a>
    </div>
  )
}
