import React from 'react'
import Header from '../../components/Header'
import ExperienceDetail from './ExperienceDetail'
import Footer from '../../components/Footer'
import ExperienceDetails from '../../components/tour/hero_section/AuthenticKhmer'

const ContactPage = () => {
  return (
    <>
      <Header/>
      <main className="max-w-6xl mx-auto px-5 py-16">
        <ExperienceDetail/>
        <ExperienceDetails/>
        <h1 className="text-3xl font-extrabold text-[#1A2B4C] mb-4">Stay in Contact</h1>
        <p className="text-[#6B7280] mb-8">Have questions about our tours? Send us a message and we'll get back to you.</p>
        <form className="space-y-4">
          <input type="text" placeholder="Your name" className="w-full border border-slate-200 rounded-md p-3" />
          <input type="email" placeholder="Your email" className="w-full border border-slate-200 rounded-md p-3" />
          <textarea placeholder="Your message" rows="5" className="w-full border border-slate-200 rounded-md p-3"></textarea>
          <button type="submit" className="bg-blue-950 text-white font-bold px-6 py-2.5 rounded-md cursor-pointer">Send Message</button>
        </form>
      </main>
      <Footer/>
    </>
  )
}

export default ContactPage
