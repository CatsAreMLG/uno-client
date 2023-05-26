const sendMessage = (
  event: any,
  socket: any,
  message: string,
  setMessage: {
    (value: React.SetStateAction<string>): void
    (arg0: string): void
  }
) => {
  event.preventDefault()
  if (message) {
    socket.emit("sendMessage", { message: message }, () => {
      setMessage("")
    })
  }
}

export default sendMessage
