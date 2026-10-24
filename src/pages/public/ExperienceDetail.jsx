import React from "react";
import { Heart, Share2, Images } from "lucide-react";
import experienceImage from "../../assets/images/lok_lak.jpg";
import experienceImage2 from "../../assets/images/papaya_salad.jpg";
import experienceImage3 from "../../assets/images/beef.jpg";
import experienceImage4 from "../../assets/images/chicken_wing.jpg";
import experienceImage5 from "../../assets/images/mishu_shrim.jpg";

const smallImages = [
  { src: experienceImage, alt: "Traditional cooking experience" },
  { src: experienceImage2, alt: "Papaya salad preparation" },
  { src: experienceImage3, alt: "Beef dish" },
  { src: experienceImage4, alt: "Chicken wing dish" },
];

export default function Experience_detail() {
  return (
    <div className="bg-white py-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
          Traditional Cooking Collage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-3 items-stretch">
          {/* Featured image */}
          <div className="relative overflow-hidden rounded-2xl shadow-md bg-white min-h-[300px] md:min-h-[440px]">
            <img
              src={experienceImage5}
              alt="Fresh seafood experience"
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />

            {/* Heart + Share */}
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                aria-label="Add to favorites"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105 cursor-pointer"
              >
                <Heart size={18} className="text-red-500" />
              </button>
              <button
                type="button"
                aria-label="Share"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105 cursor-pointer"
              >
                <Share2 size={18} className="text-slate-800" />
              </button>
            </div>
          </div>

          {/* 2x2 grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3">
            {smallImages.map((item, index) => {
              const isLast = index === smallImages.length - 1;
              return (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-2xl shadow-md bg-white min-h-[140px] md:min-h-0"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />

                  {isLast && (
                    <>
                      <div className="absolute inset-0 bg-black/40" />
                      <button
                        type="button"
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-md bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-slate-900 cursor-pointer"
                      >
                        <Images size={18} />
                        View all photos
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
