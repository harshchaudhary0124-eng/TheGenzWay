import Background from "@/components/ui/Background";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommunityHero from "@/components/CommunityHero";
import CommunityContent from "@/components/CommunityContent";
import { C, SANS } from "@/lib/constants";

export default function CommunityPage() {
  return (
    <div style={{ color: C.cream, ...SANS }}>
      <Background />
      <Nav />
      <CommunityHero />
      <CommunityContent />
      <Footer />
    </div>
  );
}
