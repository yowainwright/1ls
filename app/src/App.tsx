import Hero from '@/components/sections/hero'
import Footer from '@/components/sections/footer'
import ExamplesCarousel from '@/components/ExamplesCarousel'
import { ThemeToggle } from '@/components/theme-toggle'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <main>
        <Hero />
        <ExamplesCarousel />
      </main>
      <Footer />
    </div>
  )
}

export default App
