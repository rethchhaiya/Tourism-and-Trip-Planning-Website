import React from "react";
import { ArrowRight } from "lucide-react";

const destinations = [
  {
    name: "Siem Reap",
    tourCount: 12,
    imageUrl:
      "https://angkorwildlife.com/wp-content/uploads/2024/08/12-must-visit-places-to-visit-in-siem-reap-cambodia-1.jpg",
  },
  {
    name: "Phnom Penh",
    tourCount: 8,
    imageUrl:
      "https://d2mgzmtdeipcjp.cloudfront.net/files/good/2024/06/10/17180042317139.jpg?s=1360x1032",
  },
  {
    name: "Kampot",
    tourCount: 6,
    imageUrl:
      "https://d34vm3j4h7f97z.cloudfront.net/original/4X/8/1/e/81e31f6817402c4a711d09891d53515e0ada2571.jpeg",
  },
  {
    name: "Koh Rong",
    tourCount: 10,
    imageUrl:
      "https://d122axpxm39woi.cloudfront.net/images/destinations/origin/684161671e05d.jpg",
  },
  {
    name: "Battambang",
    tourCount: 5,
    imageUrl:
      "https://raincambodiatours.com/wp-content/uploads/Battambang-tour.webp",
  },
  {
    name: "Mondulkiri",
    tourCount: 4,
    imageUrl:
      "https://cdn.kiripost.com/static/images/Watermark01-17_-_Senmonorom_Mondul.2e16d0ba.fill-960x540.jpg",
  },
];

const PopularDestinations = () => {
  return (
    <section
      className="bg-white px-6 py-19"
      style={{
        fontFamily: "'Inter', 'Poppins', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#14213D]">
            Popular Destinations
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Explore the most beautiful places in Cambodia
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <button
              key={destination.name}
              type="button"
              className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl text-left focus:outline-none"
            >
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={destination.imageUrl}
                  alt={destination.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

                <div className="absolute bottom-0 left-0 w-full p-5">
                  <h3 className="text-xl font-bold text-white">
                    {destination.name}
                  </h3>
                  <span className="mt-2 inline-block rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    {destination.tourCount} Tours
                  </span>
                </div>

                <div className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#14213D] shadow-lg transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;
