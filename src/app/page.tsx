"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import randomCodeGenerator from "../utils/randomCodeGenerator"

import "./App.css"

export default function Lobby() {
  const [roomCode, setRoomCode] = useState("")
  return (
    <div className="Homepage">
      <div className="homepage-menu">
        <div className="logo">
          <Image src={"/uno/logo.png"} width="200" height="200" alt="logo" />
        </div>
        <div className="homepage-form">
          <div className="homepage-join">
            <input
              type="text"
              placeholder="Game Code"
              onChange={(event) => setRoomCode(event.target.value)}
              value={roomCode}
            />
            <Link href={`/play/${roomCode}`}>
              <div className="game-button green">JOIN GAME</div>
            </Link>
          </div>
          <h1 className="or">OR</h1>
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
