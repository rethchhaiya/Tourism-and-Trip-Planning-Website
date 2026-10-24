import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  CalendarDays,
  Users,
  Search,
} from "lucide-react";

const FIELD_CLASSES =
  "w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none";

function SearchField({ icon: Icon, label, placeholder, name, type = "text" }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 md:border-l md:border-gray-200 md:first:border-l-0">
      <Icon className="h-5 w-5 shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <label htmlFor={name} className="mb-1 block text-xs font-medium text-gray-500">
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={FIELD_CLASSES}
        />
      </div>
    </div>
  );
}

export default function HeroSection({ images = [], autoPlay = true }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const count = images.length;

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 5000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [autoPlay, paused, count]);

  const goTo = (index) => {
    setCurrent(((index % count) + count) % count);
  };

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + count) % count);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % count);
  };

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-125 w-full animate-fade-in overflow-hidden md:h-137.5">
        {count > 0 ? (
          images.map((src, index) => (
            <div
              key={index}
              aria-hidden={index !== current}
              className="absolute inset-0 h-full w-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url('${src}')`,
                opacity: index === current ? 1 : 0,
              }}
            />
          ))
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gray-800" />
        )}

        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/50 to-black/60" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="max-w-4xl animate-fade-up text-4xl font-bold leading-tight text-white [animation-delay:0.2s] sm:text-5xl md:text-6xl">
            Discover Your Next Adventure
          </h1>

          <p className="mt-6 max-w-125 animate-fade-up text-base leading-relaxed text-white/90 [animation-delay:0.4s] md:text-lg">
            Explore amazing destinations and create unforgettable memories with
            expert-guided tours.
          </p>

          <div className="mt-10 flex w-full animate-fade-up flex-col items-center gap-4 [animation-delay:0.6s] sm:w-auto sm:flex-row">
            <a
              href="#tours"
              className="w-full rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-600 sm:w-auto"
            >
              Explore Tours
            </a>
            <a
              href="#destinations"
              className="w-full rounded-lg border-2 border-white/80 px-6 py-3 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto"
            >
              View Destinations
            </a>
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white transition-colors duration-200 hover:bg-black/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white transition-colors duration-200 hover:bg-black/50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current}
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === current
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative z-20 mx-auto -mt-16 mb-8 w-[92%] max-w-4xl animate-fade-up rounded-2xl bg-white p-2 shadow-xl shadow-black/10 [animation-delay:0.8s] sm:p-3">
        <form className="grid grid-cols-1 gap-y-2 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-0">
          <SearchField
            icon={MapPin}
            label="Destination"
            placeholder="Where are you going?"
            name="destination"
          />
          <SearchField
            icon={CalendarDays}
            label="Travel Date"
            placeholder="Choose a date"
            name="travelDate"
            type="date"
          />
          <SearchField
            icon={Users}
            label="Guests"
            placeholder="How many guests?"
            name="guests"
            type="number"
          />
          <button
            type="submit"
            className="mx-5 my-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-600 md:m-3 md:px-7"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>
    </section>
  );
}