import React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import TopAttractions from './TopAttractions'
import TravelSection from './PracticalSection'
import DestinationDetail from './DestinationDetailPage'
import { AvailableTours } from './AvailableTours'
import DestinationCTA from '../../components/DestinationCTA'

const DestinationsPage = () => {
  return (
    <>
      <Header/>
      <main>
        {/*  */}
        <DestinationDetail/>
        <TopAttractions/>
        <AvailableTours/>
        <TravelSection/>
        <DestinationCTA/>
      </main>
      <Footer/>
    </>
  )
}

export default DestinationsPage

