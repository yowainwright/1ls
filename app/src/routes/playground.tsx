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
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Playground
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Experiment with 1ls expressions in real-time
              </p>
            </div>
          </div>
        </section>
        <Playground />
      </main>
      <Footer className="relative z-10" />
    </>
  )
}
