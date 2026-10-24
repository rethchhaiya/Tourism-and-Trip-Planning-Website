import React from "react";

/**
 * Font pairing used in this design (matches source screenshot):
 *  - Headings: Poppins, bold (font-heading)
 *  - Body/labels: Inter, regular/medium (font-sans, the default)
 * Load both via Google Fonts and map "heading" in tailwind.config.js
 * under theme.extend.fontFamily for this to render correctly.
 */

const tips = [
  {
    number: "01",
    title: "Bring warm clothing",
    body: "Mondulkiri's highlands get surprisingly cold during winter evenings, dropping to 15°C. Pack jackets and sweaters.",
  },
  {
    number: "02",
    title: "Protect from insects",
    body: "Deep forest trekking calls for high-strength mosquito repellent and long sleeves or pants to prevent bites.",
  },
  {
    number: "03",
    title: "Respect sanctuary rules",
    body: "Do not ride or force interaction with elephants. Follow the certified guidelines at ethical parks.",
  },
  {
    number: "04",
    title: "Cash is king",
    body: "ATM coverage is sparse outside Sen Monorom town. Always carry enough local riel or USD.",
  },
];

const gallery = [
  {
    src: "https://d30rwgcdkx0urh.cloudfront.net/uploads/h1-mondulkiri-in-cambodia-1732084966.jpg",
    alt: "Misty hills at sunrise over the Mondulkiri highlands",
  },
  {
    src: "https://media.istockphoto.com/photos/asian-elephants-picture-id184860186?k=20&m=184860186&s=612x612&w=0&h=iwMIo54DK8rWV-24ektPCzwGynXM4b1xsk4yOuCn1CY=",
    alt: "A Bunong forager gathering leaves in the forest",
  },
  {
    src: "https://thumbs.dreamstime.com/b/bou-sra-waterfall-also-referred-to-as-bousra-bu-busra-boo-scenic-now-located-eco-park-pech-chreada-district-mondulkiri-206378016.jpg",
    alt: "A waterfall cascading through the jungle",
  },
];

export default function MondulkiriTravelSection() {
  return (
    <div className="bg-white font-sans text-stone-800">
      {/* Practical tips */}
      <section className="bg-emerald-50/60 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <img
              src="https://i.pinimg.com/736x/fd/01/82/fd0182ecf1351af8852e71c953a98254.jpg"
              alt="Coffee farm terraces in the Mondulkiri hills"
              className="h-72 w-full object-cover lg:h-96"
            />
          </div>

          <div>
            <h2 className="font-heading text-3xl font-bold text-emerald-950 sm:text-4xl">
              Practical Travel Tips
            </h2>
            <ol className="mt-8 space-y-6">
              {tips.map((tip) => (
                <li key={tip.number} className="flex gap-4">
                  <span className="shrink-0 font-heading text-lg font-bold text-teal-700">
                    {tip.number}
                  </span>
                  <div>
                    <p className="font-heading font-semibold text-emerald-950">
                      {tip.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">
                      {tip.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-3xl font-bold text-emerald-950 sm:text-4xl">
            Mondulkiri Through The Lens
          </h2>
          <p className="mt-3 text-stone-500">
            Moments of serene, raw beauty captured on our treks
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {gallery.map((img) => (
              <div
                key={img.alt}
                className="overflow-hidden rounded-2xl shadow-sm"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-80 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}