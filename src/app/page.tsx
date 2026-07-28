import SpaceBackgroundLoader from '@/components/SpaceBackgroundLoader';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import WhySection from '@/components/WhySection';
import ConnectSection from '@/components/ConnectSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      {/* Fixed 3-D canvas layer — sits behind everything via z-index */}
      <SpaceBackgroundLoader />

      {/* All page content sits above the canvas */}
      <div className="content-layer">
        <Navbar />
        <main>
          <HeroSection />
          <WhySection />
          <ConnectSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
