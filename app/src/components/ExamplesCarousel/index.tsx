import { motion } from "framer-motion"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { SectionHeader } from "@/components/SectionHeader"
import { EASE_CURVE } from "@/lib/styles"
import { SpotlightCard } from "./components"
import { CODE_EXAMPLES } from "./constants"

export default function ExamplesCarousel() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Works With Any Format"
          description="JSON, YAML, CSV, TypeScript, plain text, and more - all with the same simple syntax"
          className="mb-12"
        />
        <CarouselWrapper />
      </div>
    </section>
  )
}

function CarouselWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE_CURVE }}
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
