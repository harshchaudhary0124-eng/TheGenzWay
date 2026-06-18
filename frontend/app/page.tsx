import GlobalBackground from "@/components/ui/GlobalBackground";
import Grain from "@/components/ui/Grain";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import WhoSection from "@/components/WhoSection";
import ManifestoArrow from "@/components/ManifestoArrow";
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
      <div style={{ position: "relative" }}>
        <Manifesto />
        <WhoSection />
        <ManifestoArrow />
      </div>
      <Projects />
      <ExperimentalType />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
