import GlobalBackground from "@/components/ui/GlobalBackground";
import Grain from "@/components/ui/Grain";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import Problem from "@/components/Problem";
import WhoSection from "@/components/WhoSection";
import Projects from "@/components/Projects";
import ExperimentalType from "@/components/ExperimentalType";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { C, SANS } from "@/lib/constants";

export default function Page() {
  return (
    <div style={{ color: C.cream, overflowX: "hidden", ...SANS }}>
      <GlobalBackground />
      <Grain />
      <Nav />
      <Hero />
      <Manifesto />
      <Problem />
      <WhoSection />
      <Projects />
      <ExperimentalType />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
