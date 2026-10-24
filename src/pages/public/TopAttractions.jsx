import React from "react";


const attraction = [
  {
    id: 1,
    title: "Bousra Waterfall",
    description: "Cambodia's most iconic double-drop waterfall thundering down volcanic cliffs.",
    image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/f5/db/44/photo1jpg.jpg?w=1200&h=-1&s=1"
  },
  {
    id: 2,
    title: "Elephant Valley",
    description: "A highly ethical sanctuary where retired elephants roam freely through their natural forest home.",
    image: "https://focus-cambodia.com/wp-content/uploads/2023/07/elephant_valley_project_mondulkiri_006.jpg"
  },
  {
    id: 3,
    title: "Sea Forest Viewpoint",
    description: "Overlook an endless landscape of lush rolling green hilltops that resemble sea waves.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLyERTfEKfr0aocv4YL8k8kpGswtObxe1AzMqt2D6K8g85AA8k33DCVcM&s=10"
  }
]
const TopAttractions = () => {
  return (
    <section className="bg-[#f5f6f8ed] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A2B4C] md:text-[38px]">
            Top Attractions in Mondulkiri
          </h2>
          <p className="mt-4 text-base text-[#6B7280] md:text-lg">
            Experience the natural wonders of Cambodia's wild East
          </p>
        </div>
        {/* image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {attraction.map(({id, title, description, image}) => (
              <div className="group relative h-full overflow-hidden rounded-2xl" key={id}>
                <img className=" h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                 src={image} alt={title} />
                 <div className="absolute left-0 bottom-0 p-6 text-white">
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <p className="mt-2 text-sm text-white/80"> {description} </p>
                 </div>
              </div>
              
          ))}

        </div>
      </div>
    </section>
  );
};

export default TopAttractions;
