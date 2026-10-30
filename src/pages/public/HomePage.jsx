import React from 'react'
import PromoBanner from '../../components/tour/PromoBanner'
import ExperienceSection from '../../components/tour/ExperienceSection'
import PopularDestinations from '../../components/tour/PopularDestinations'
import WhyChooseUs from '../../components/tour/WhyChooseUs'
import HeroSection from './HeroSection'
import FeaturedTourPackages from './TourPackages'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const HERO_IMAGES = [
  'https://i.pinimg.com/1200x/ed/bf/73/edbf7353393cc3d039792dc89a0dd4b6.jpg',
  'https://i.pinimg.com/1200x/bf/49/1c/bf491c2d5cea22db9afaf280cba0466c.jpg',
  'https://i.pinimg.com/736x/2e/d1/d4/2ed1d4c57b64b38d2e09c346c3e771d7.jpg',
  'https://i.pinimg.com/1200x/ed/dd/ca/edddca5d0d69b6071e5bb630135f69c5.jpg',
]

const HomePage = () => {
  return (
    <>
      <Header/>
      <main>
        <HeroSection images={HERO_IMAGES} />
        <PopularDestinations/>
        <FeaturedTourPackages/>
        <PromoBanner/>
        <ExperienceSection/>
        <WhyChooseUs/>
        {/* <TravelSection/> */}
      </main>
      <Footer/>
    </>
  )
}

export default HomePage
