import { motion } from "framer-motion";
import { SectionHeader } from "@/components/SectionHeader";
import { EASE_CURVE } from "@/lib/styles";
import { INSIGHTS_CONSTANTS } from "./constants";
import type { InsightProps } from "./types";

const { styles, text, items } = INSIGHTS_CONSTANTS;

export function Insights({ className = "" }: InsightProps) {
  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <SectionHeader title={text.sectionTitle} description={text.sectionDescription} />
        <div className={styles.grid}>
          {items.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  stat: (typeof items)[number];
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
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
        <motion.div
          className={styles.value}
          style={{
            background: "linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--accent)) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {stat.value}
        </motion.div>
        <div className={styles.label}>{stat.label}</div>
        <p className={styles.description}>{stat.description}</p>
      </div>
    </motion.div>
  );
}
