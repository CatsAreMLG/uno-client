export default function Lobby({
  params: { slug },
}: {
  params: { slug: string }
}) {
  return <div className="flex items-center justify-center p-8">{slug}</div>
}
