import { motion } from "framer-motion"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { SpotlightCard } from "./components"
import { CODE_EXAMPLES } from "./constants"

const ease = [0.16, 1, 0.3, 1] as const

export default function ExamplesCarousel() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader />
        <CarouselWrapper />
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <motion.div
      className="mb-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
    >
      <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Works With Any Format
      </h2>
      <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
        JSON, YAML, CSV, TypeScript, plain text, and more - all with the same simple syntax
      </p>
    </motion.div>
  )
}

function CarouselWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2, ease }}
    >
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {CODE_EXAMPLES.map((example, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <SpotlightCard example={example} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </motion.div>
  )
}
