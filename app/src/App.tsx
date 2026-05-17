import { lazy, Suspense } from "react";
import Hero from "@/components/sections/hero";
import Footer from "@/components/sections/footer";
import ExamplesCarousel from "@/components/ExamplesCarousel";
import { Playground } from "@/components/Playground";

const ShaderBackground = lazy(() => import("@/components/ShaderBackground"));

function App() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Suspense fallback={<div className="shader-background" aria-hidden="true" />}>
        <ShaderBackground />
      </Suspense>
      <main className="relative z-10">
        <Hero />
        <Playground />
        <ExamplesCarousel />
      </main>
      <Footer className="relative z-10" />
    </div>
  );
}

export default App;
