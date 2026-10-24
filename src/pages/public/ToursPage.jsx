import React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import TourGallery from '../../components/tour/hero_section/TourGallery'
import TourLight from './tour/TourLight'
import Tours_detailContent from '../../components/tour/ToursDetailContent/ToursDetailContent'

const ToursPage = () => {
  return (
    <>
      <Header/>
      <main>
        <TourGallery/>
        <Tours_detailContent/>
        <TourLight/>
      </main>
      <Footer/>
    </>
  )
}

export default ToursPage
