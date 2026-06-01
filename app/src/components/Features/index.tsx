import { motion } from "framer-motion";
import { Code, Files, Zap, Sparkles, Command, Folder } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { EASE_CURVE } from "@/lib/styles";
import { FEATURES_CONSTANTS } from "./constants";
import type { FeaturesProps, Feature } from "./types";

const { styles, text, items } = FEATURES_CONSTANTS;

const iconMap: Record<string, typeof Code> = {
  code: Code,
  files: Files,
  zap: Zap,
  sparkles: Sparkles,
  command: Command,
  folder: Folder,
};

export function Features({ className = "" }: FeaturesProps) {
  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <SectionHeader title={text.sectionTitle} description={text.sectionDescription} />
        <div className={styles.grid}>
          {items.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = iconMap[feature.icon] || Code;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE_CURVE }}
    >
      <div className={styles.cardOverlay} />
      <div className={styles.cardInner}>
        <div className={styles.iconWrap}>
          <Icon className={styles.icon} />
        </div>
        <h3 className={styles.title}>{feature.title}</h3>
        <p className={styles.description}>{feature.description}</p>
      </div>
    </motion.div>
  );
}
