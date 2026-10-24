import React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import HeroSectionAbout from './HeroSectionAbout'
import TravelInspiration from '../../components/TravelInspiration'

const AboutPage = () => {
  return (
    <>
      <Header/>
      <main>
        <HeroSectionAbout/>
        <TravelInspiration/>
      </main>
      <Footer/>
    </>
  )
}

export default AboutPage
