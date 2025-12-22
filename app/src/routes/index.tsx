import { createFileRoute } from '@tanstack/react-router'
import Hero from '@/components/sections/hero'
import Footer from '@/components/sections/footer'
import ExamplesCarousel from '@/components/ExamplesCarousel'
import { Features } from '@/components/Features'
import { Insights } from '@/components/Insights'
import { Playground } from '@/components/Playground'
import { TooltipDemo } from '@/components/TooltipDemo'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <main className="relative z-10">
        <Hero />
        <Features />
        <TooltipDemo />
        <ExamplesCarousel />
        <Insights />
        <Playground />
      </main>
      <Footer className="relative z-10" />
    </>
  )
}
