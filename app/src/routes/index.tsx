import { createFileRoute } from '@tanstack/react-router'
import Hero from '@/components/sections/hero'
import Footer from '@/components/sections/footer'
import ExamplesCarousel from '@/components/ExamplesCarousel'
import { Playground } from '@/components/Playground'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <main className="relative z-10">
        <Hero />
        <Playground />
        <ExamplesCarousel />
      </main>
      <Footer className="relative z-10" />
    </>
  )
}
