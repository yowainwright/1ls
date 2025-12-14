import { createFileRoute } from '@tanstack/react-router'
import { Playground } from '@/components/Playground'
import Footer from '@/components/sections/footer'

export const Route = createFileRoute('/playground')({
  component: PlaygroundPage,
})

function PlaygroundPage() {
  return (
    <>
      <main className="relative z-10">
        <Playground mode="sandbox" />
      </main>
      <Footer className="relative z-10" />
    </>
  )
}
