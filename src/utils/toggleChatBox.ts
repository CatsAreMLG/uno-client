const toggleChatBox = (
  isChatBoxHidden: boolean,
  setChatBoxHidden: {
    (value: React.SetStateAction<boolean>): void
    (arg0: boolean): void
  }
) => {
  const chatBody = document.querySelector(".chat-body") as HTMLDivElement
  if (isChatBoxHidden) {
    chatBody.style.display = "block"
    setChatBoxHidden(false)
  } else {
    chatBody.style.display = "none"
    setChatBoxHidden(true)
  }
}

export default toggleChatBox
