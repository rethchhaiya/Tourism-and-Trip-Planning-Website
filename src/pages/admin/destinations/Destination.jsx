import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
     faFloppyDisk,
     faChevronDown,
     faXmark,
} from '@fortawesome/free-solid-svg-icons';

function Destination() {

     const [value, setValue] = useState("");
     const [active, setActive] = useState(false);

     const handleChange = (e) => {
          const rawValue = e.target.value;

          if (rawValue === "") {
               setValue("");
               return;
          }

          const numericValue = parseFloat(rawValue);

          if (!isNaN(numericValue)) {
               setValue(numericValue);
          }
     }
     const handleSave = () => {

     }

     return (
          <>
               <div className="min-h-screen bg-[#f8f8fc] px-4 py-5 text-gray-800">

                    {/* Header */}
                    <form onSubmit={handleSave}>

                         <div className="mb-4 flex items-center justify-between">
                              <div>
                                   <div className="mb-1 flex items-center gap-1 text-[11px] text-gray-400">
                                        <span>Destinations</span>
                                        <span>›</span>
                                        <span>Add New</span>
                                   </div>

                                   <h1 className="text-[20px] font-bold leading-tight text-gray-900">
                                        Add Destination
                                   </h1>

                                   <p className="mt-0.5 text-[11px] text-gray-500">
                                        Create a new travel destination master record.
                                   </p>
                              </div>

                              <div className="flex items-center gap-2">
                                   <button
                                        type="button"
                                        className="rounded border border-gray-300 bg-transparent px-4 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                                   >
                                        Cancel
                                   </button>

                                   <button
                                        type="button"
                                        className="flex items-center gap-1.5 rounded bg-[#5146e5] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#4338ca]"
                                   >
                                        <FontAwesomeIcon icon={faFloppyDisk} style={{ color: "white", }} />
                                        Save Destination
                                   </button>
                              </div>
                         </div>


                         {/* Basic Information */}
                         <div className="mb-3 rounded-md border border-[#dedee8] bg-white p-4 shadow-sm">

                              <div className="mb-3 border-b border-[#e3e3ec] pb-2">
                                   <h2 className="text-[11px] font-bold text-gray-700">
                                        Basic Information
                                   </h2>
                              </div>

                              {/* Destination Name */}
                              <div className="mb-3">
                                   <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                        Destination Name
                                        <span className="text-red-500">*</span>
                                   </label>

                                   <input
                                        type="text"
                                        placeholder="e.g., Kyoto, Japan"
                                        className="h-9 w-full rounded border border-[#d9d9e4] bg-white px-3 text-[11px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#6558e6] focus:ring-1 focus:ring-[#6558e6]/20"
                                   />
                              </div>

                              {/* Country + Region */}
                              <div className="grid grid-cols-2 gap-3">

                                   <div>
                                        <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide  text-gray-500">
                                             Country
                                             <span className="text-red-500">*</span>
                                        </label>

                                        <div className="relative">
                                             <select
                                                  className="h-9 w-full appearance-none rounded border border-[#d9d9e4] transition-all ease-in bg-white px-3 pr-8 text-[11px] text-gray-600 outline-none focus:border-[#9892dc]"
                                             >
                                                  <option>Select a country</option>
                                                  <option>Japan</option>
                                                  <option>Cambodia</option>
                                                  <option>Vietnam</option>
                                             </select>

                                             <FontAwesomeIcon
                                                  icon={faChevronDown}
                                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-500"
                                             />
                                        </div>
                                   </div>

                                   <div>
                                        <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                             Region / City
                                        </label>

                                        <input
                                             type="text"
                                             placeholder="e.g., Kansai"
                                             className="h-9 w-full rounded border border-[#d9d9e4] bg-white px-3 text-[11px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#6558e6] focus:ring-1 focus:ring-[#6558e6]/20"
                                        />
                                   </div>

                              </div>

                              {/* Status */}
                              <div className="mt-3 flex items-center justify-between rounded bg-[#f0f1ff] px-3 py-2.5">

                                   <div>
                                        <p className="text-[10px] font-semibold text-gray-700">
                                             Destination Status
                                        </p>

                                        <p className="text-[9px] text-gray-500">
                                             Active destinations are visible to customers.
                                        </p>
                                   </div>

                                   {/* Static Toggle */}
                                   <div
                                        onClick={() => setActive(!active)}
                                        className={`relative h-4 w-7 cursor-pointer rounded-full transition-colors ${active ? "bg-[#5b50e6]" : "bg-gray-300"
                                             }`}
                                   >
                                        <div
                                             className={`absolute top-[2px] h-3 w-3 rounded-full bg-white shadow transition-all ${active ? "right-[2px]" : "left-[2px]"
                                                  }`}
                                        ></div>
                                   </div>

                              </div>
                         </div>


                         {/* Description */}
                         <div className="mb-3 rounded-md border border-[#dedee8] bg-white p-4 shadow-sm">

                              <div className="mb-3 border-b border-[#e3e3ec] pb-2">
                                   <h2 className="text-[11px] font-bold text-gray-700">
                                        Description
                                   </h2>
                              </div>

                              {/* Short Summary */}
                              <div className="mb-3">
                                   <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                        Short Summary
                                   </label>

                                   <input
                                        type="text"
                                        placeholder="A brief one-sentence hook for the destination card..."
                                        className="h-9 w-full rounded border border-[#d9d9e4] px-3 text-[11px] outline-none placeholder:text-gray-400 focus:border-[#6558e6] focus:ring-1 focus:ring-[#6558e6]/20"
                                   />

                                   <div className="mt-0.5 text-right text-[8px] text-gray-500">
                                        0/100 characters
                                   </div>
                              </div>

                              {/* Full Description */}
                              <div>
                                   <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                        Full Description
                                   </label>

                                   <textarea
                                        rows="5"
                                        placeholder="Detailed description of the destination, its culture, attractions, and appeal..."
                                        className="w-full resize-none rounded border border-[#d9d9e4] px-3 py-2 text-[11px] outline-none placeholder:text-gray-400 focus:border-[#6558e6] focus:ring-1 focus:ring-[#6558e6]/20"
                                   ></textarea>
                              </div>

                         </div>


                         {/* Details */}
                         <div className="rounded-md border border-[#dedee8] bg-white p-4 shadow-sm">

                              <div className="mb-3 border-b border-[#e3e3ec] pb-2">
                                   <h2 className="text-[11px] font-bold text-gray-700">
                                        Details
                                   </h2>
                              </div>

                              {/* Tours + Season */}
                              <div className="grid grid-cols-2 gap-3">

                                   <div>
                                        <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                             Number of Tours
                                        </label>

                                        <input
                                             type="number"
                                             value={value}
                                             onChange={handleChange}
                                             className="h-9 w-full rounded border border-[#d9d9e4] px-3 text-[11px] outline-none focus:border-[#6558e6]"
                                        />
                                   </div>

                                   <div>
                                        <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                             Best Season to Visit
                                        </label>

                                        <div className="relative">
                                             <select
                                                  name="bestSesionToVisite"
                                                  className="h-9 w-full appearance-none rounded border border-[#d9d9e4] bg-white px-3 pr-8 text-[11px] text-gray-600 outline-none transition-all duration-200 hover:bg-[#f5f4ff] focus:border-[#6558e6] focus:bg-[#f5f4ff]"
                                             >
                                                  <option value="">
                                                       Select a season
                                                  </option>

                                                  <option value="Spring">
                                                       Spring
                                                  </option>

                                                  <option value="Summer">
                                                       Summer
                                                  </option>

                                                  <option value="Autumn">
                                                       Autumn
                                                  </option>

                                                  <option value="Winter">
                                                       Winter
                                                  </option>
                                             </select>

                                             <FontAwesomeIcon
                                                  icon={faChevronDown}
                                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-500"
                                             />
                                        </div>
                                   </div>

                              </div>

                              {/* Tags */}
                              <div className="mt-3">

                                   <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                        Tags / Highlights
                                   </label>

                                   <div className="flex min-h-9 flex-wrap items-center gap-1 rounded border border-[#d9d9e4] bg-white px-2 py-1.5">

                                        {/* Beach Badge */}
                                        <span className="inline-flex relative pr-5 items-center gap-1 rounded-sm bg-[#e8eafa] px-2.5 py-1 text-[9px] font-medium text-[#5146e5] transition-all duration-200 hover:bg-[#dfe1f8]">
                                             Beach

                                             <FontAwesomeIcon
                                                  icon={faXmark}
                                                  className="cursor-pointer absolute top-1 right-1 text-[8px] text-[#5146e5] transition-colors duration-150 hover:text-red-500"
                                             />
                                        </span>

                                        {/* Historic Badge */}
                                        <span className="inline-flex relative pr-5 items-center gap-1 rounded-sm bg-[#e8eafa] px-2.5 py-1 text-[9px] font-medium text-[#5146e5] transition-all duration-200 hover:bg-[#dfe1f8]">
                                             Historic

                                             <FontAwesomeIcon
                                                  icon={faXmark}
                                                  className="cursor-pointer absolute top-1 right-1 text-[8px] text-[#5146e5] transition-colors duration-150 hover:text-red-500"
                                             />
                                        </span>

                                        {/* Adventure Badge */}
                                        <span className="inline-flex relative items-center gap-1 rounded-sm bg-[#e8eafa] px-2.5 pr-5 py-1 text-[9px] font-medium text-[#5146e5] transition-all duration-200 hover:bg-[#dfe1f8]">
                                             Adventure

                                             <FontAwesomeIcon
                                                  icon={faXmark}
                                                  className="cursor-pointer absolute top-1 right-1 text-[8px] text-[#5146e5] transition-colors duration-150 hover:text-red-500"
                                             />
                                        </span>

                                        {/* Add Tag */}
                                        <button className="cursor-pointer rounded-sm px-2 py-1 text-[10px] text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600">
                                             Add tag...
                                        </button>

                                   </div>

                              </div>

                         </div>
                    </form>

               </div>

          </>
     )
}


export default Destination;