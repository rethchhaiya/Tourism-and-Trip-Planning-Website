import HighLightCompo from "../../../components/tour/HighLightCompo";
import { Landmark, Star, Building, Car, Utensils, Calendar } from "lucide-react";

const TourLight = () => {
  const cards = [
    {
      id: 1,
      icon: <Landmark className="h-4 w-4 md:h-5 md:w-5" />,
      visit: "Visit Angkor Wat",
      txtPara:
        "Experience the monumental UNESCO world heritage temple at its finest.",
    },
    {
      id: 2,
      icon: <Star className="h-4 w-4 md:h-5 md:w-5" />,
      visit: "Professional Tour Guide",
      txtPara:
        "Gain insightful facts from certified local experts speaking fluent English.",
    },
    {
      id: 3,
      icon: <Building className="h-4 w-4 md:h-5 md:w-5" />,
      visit: "Hotel Included",
      txtPara:
        "Relax in comfortable air-conditioned 4-star boutique hotels downtown.",
    },
    {
      id:4,
      icon: <Car className="h-4 w-4 md:h-5 md:w-5" />,
      visit:'Transportation Included',
      txtPara :
        "Travel hassle-free between attractions in a private car or van."
    },
    {
      id:5,
      icon:<Utensils className="h-4 w-4 md:h-5 md:w-5" />,
      visit: "Local Food Experience",
      txtPara: "Savor authentic Khmer lunches prepared fresh daily."
    },{
      id:6,
      icon :<Calendar className="h-4 w-4 md:h-5 md:w-5" />,
      visit :"Free Cancellation",
      txtPara: "Change plans securely with zero cancellation fees up to 24h prior."
    }
  ];
  
  return (
    <div className="mx-auto max-w-[1200px] mb-8 py-10">
      <h1 className="text-xl md:text-4xl text-gray-800 p-4 font-bold text-center md:text-left">Tour Highlights</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {cards.map((card) => (
          <HighLightCompo
            key={card.id}
            icon={card.icon}
            visit={card.visit}
            txtPara={card.txtPara}
          />
        ))}
      </div>
    </div>
  );
};

export default TourLight;



