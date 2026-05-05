import NavbarLanding from '../../components/Navbar/NavbarLanding'
import { Footer } from '../../components/FooterCTA'
import Hero from '../../components/Landing/Hero'
import Pricing from '../../components/Landing/Pricing'
import SoundAssist from '../../components/Landing/SoundAssist'

function Landing() {
  return (
    <div className="min-h-screen bg-bg font-sans">
        <div className="noise-overlay" />
        <NavbarLanding />

        <main>
            <Hero />
            <Pricing />
            <SoundAssist />
        </main>

        <Footer />
    </div>
  )
}

export default Landing
