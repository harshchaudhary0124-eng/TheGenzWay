import Background from "@/components/ui/Background";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import WhoSection from "@/components/WhoSection";
import ManifestoArrow from "@/components/ManifestoArrow";
import ExperimentalType from "@/components/ExperimentalType";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { C, SANS } from "@/lib/constants";

export default function Page() {
  return (
    <div style={{ color: C.cream, ...SANS }}>
      <Background />
      <Nav />
      <Hero />
      <div style={{ position: "relative" }}>
        <Manifesto />
        <WhoSection />
        <ManifestoArrow />
      </div>
      <ExperimentalType />
      <div className="min-h-screen flex flex-col">
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
