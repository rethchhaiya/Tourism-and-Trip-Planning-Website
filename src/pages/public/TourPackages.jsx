import React from "react";
import { Star, MapPin, Heart } from "lucide-react";

const tours = [
  {
    id: 1,
    location: "Siem Reap",
    title: "Angkor Wat Discovery",
    duration: "3 Days / 2 Nights",
    rating: 5.0,
    reviews: 999,
    price: 150,
    image:
      "https://www.areacambodia.com/wp-content/uploads/2023/09/Experiencing-the-Magical-Equinox-Sunrise-at-Angkor-Wat-A-Must-See-in-Cambodia-2023.jpg",
  },
  {
    id: 2,
    location: "Koh Rong",
    title: "Koh Rong Island Escape",
    duration: "3 Days / 2 Nights",
    rating: 4.9,
    reviews: 218,
    price: 120,
    image:
      "https://www.asiakingtravel.com/cuploads/files/koh-rong-island-1.jpg",
  },
  {
    id: 3,
    location: "Kampot",
    title: "Kampot Nature Adventure",
    duration: "2 Days / 1 Night",
    rating: 4.9,
    reviews: 156,
    price: 90,
    image:
      "https://img.freepik.com/premium-photo/seahorse-kampot-cambodia-new-iconic-province-amazing-cambodia_720542-139.jpg",
  },
//  {
//     id: 4,
//     location: "Phnom Penh",
//     title: "Phnom Penh Capital City",
//     duration: "2 Days / 1 Night",
//     rating: 5.0,
//     reviews: 999,
//     price: 99,
//     image:
//       "https://www.novotelphnompenhbkk1.com/wp-content/uploads/sites/53/2023/08/royal-palace-1920x1200.jpg",
//   },
];

function TourCard({ tour }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="relative h-48 sm:h-52">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          aria-label="Save to favorites"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
          <MapPin className="w-3.5 h-3.5" />
          <span>{tour.location}</span>
        </div>

        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          {tour.title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">{tour.duration}</span>
          <span className="flex items-center gap-1 font-medium text-slate-900">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {tour.rating.toFixed(1)}
            <span className="text-slate-400 font-normal">
              ({tour.reviews})
            </span>
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400">Price per person</p>
            <p className="text-xl font-bold text-orange-500">
              ${tour.price}
            </p>
          </div>
          <button
            type="button"
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedTourPackages() {
  return (
    <section className="bg-slate-50 min-h-screen py-15 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Featured Tour Packages
          </h2>
          <p className="mt-2 text-slate-500">
            Handpicked tours for unforgettable experiences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}