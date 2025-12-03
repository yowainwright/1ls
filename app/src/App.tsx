import Hero from '@/components/sections/hero'
import Footer from '@/components/sections/footer'
import ExamplesCarousel from '@/components/ExamplesCarousel'
import { Playground } from '@/components/Playground'

function App() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="aurora-gradient" />
      <main className="relative z-10">
        <Hero />
        <Playground />
        <ExamplesCarousel />
      </main>
      <Footer className="relative z-10" />
    </div>
  )
}

export default App
