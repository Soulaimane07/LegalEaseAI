import NavbarLanding from '../../components/Navbar/NavbarLanding'
import { Footer } from '../../components/FooterCTA'
import Hero from '../../components/Hero'
import Features from '../../components/Features'
import Modes from '../../components/Modes'
import Pricing from '../../components/Pricing'
import SoundAssist from '../../components/SoundAssist'

function Landing() {
  return (
    <div className="min-h-screen bg-bg font-sans">
        <div className="noise-overlay" />
        <NavbarLanding />

        <main>
            <Hero />
            {/* <Features /> */}
            {/* <Modes /> */}
            <Pricing />
            <SoundAssist />
        </main>

        <Footer />
    </div>
  )
}

export default Landing
