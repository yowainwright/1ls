import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeader } from "@/components/SectionHeader";
import { EASE_CURVE } from "@/lib/styles";
import { SpotlightCard } from "./components";
import { EXAMPLES_CAROUSEL_CONSTANTS } from "./constants";

const { styles, text, items } = EXAMPLES_CAROUSEL_CONSTANTS;

export default function ExamplesCarousel() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeader
          title={text.sectionTitle}
          description={text.sectionDescription}
          className={styles.sectionHeaderClassName}
        />
        <CarouselWrapper />
      </div>
    </section>
  );
}

function CarouselWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE_CURVE }}
    >
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {items.map((example, index) => (
            <CarouselItem key={index} className={styles.carouselItem}>
              <SpotlightCard example={example} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </motion.div>
  );
}
