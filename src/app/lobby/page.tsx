import Link from "next/link"
import { useState } from "react"
import randomCodeGenerator from "../../utils/randomCodeGenerator"

export default function Lobby() {
  const [roomCode, setRoomCode] = useState("")
  return (
    <div className="Homepage">
      <div className="homepage-menu">
        <img src={require("../assets/logo.png").default} width="200px" />
        <div className="homepage-form">
          <div className="homepage-join">
            <input
              type="text"
              placeholder="Game Code"
              onChange={(event) => setRoomCode(event.target.value)}
            />
            <Link href={`/play/${roomCode}`}>
              <div className="game-button green">JOIN GAME</div>
            </Link>
          </div>
          <h1>OR</h1>
          <div className="homepage-create">
            <Link href={`/play/${randomCodeGenerator(5)}`}>
              <div className="game-button orange">CREATE GAME</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
