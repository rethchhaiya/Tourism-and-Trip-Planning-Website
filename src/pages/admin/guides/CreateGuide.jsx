import React from "react";

const CreateGuide = () => {
  return (
    <>
      <div className="p-[20px] bg-gray-50">
        <ul className="flex gap-2 items-center">
          <li>
            <a href="" className="text-gray-500 text-[14px]">
              Guides
            </a>
          </li>
          <span>
            <svg
              className="w-[12px] h-[12px] "
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-chevron-right"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"
              />
            </svg>
          </span>
          <li>
            <a href="" className="font-bold text-gray-500 text-[14px]">
              Add New
            </a>
          </li>
        </ul>

        <div className="mainTitleHead flex justify-between items-center">
          <section className="main-titleGuide py-6">
            <h1 className="text-[20px] font-bold">Booking Management</h1>
            <p className="text-[12px] text-gray-600">
              Manage and track all tour bookings
            </p>
          </section>
          <section className="btnSubmit flex gap-4">
            <button className=" cursor-pointer border-[1px] border-gray-300 py-2 px-4 rounded-md hover:bg-gray-300">cancel</button>
            <button className="cursor-pointer py-2 px-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 flex gap-2 items-center">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy" viewBox="0 0 16 16">
                  <path d="M11 2H9v3h2z"/>
                  <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z"/>
                </svg>
              </span>
              Save Guide
            </button>
          </section>
        </div>

        <div className="w-full py-4 border-[1px] border-gray-200 shadow-md p-5">
          <div className="titleBasicInformation w-full">
            <h2 className="text-[20px] font-bold ">Basic Information</h2>
            <div className="w-full h-[2px] bg-gray-100 my-4"></div>
          </div>

          <form action="" className="">
            <div className="basicinfomation grid grid-cols-2 gap-[20px]">
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  License Number *
                </label>
                <input
                  type="text"
                  placeholder="Enter license number"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Email*
                </label>
                <input
                  type="text"
                  placeholder="Enter email address"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Languages *
                </label>
                <select
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px] font-bold"
                >
                  <option value="">Select languages</option>
                </select>
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Specialties *
                </label>
                <input
                  type="text"
                  placeholder="Enter Specialties"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
            </div>
            <div className="bio">
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Bio *
                </label>
                <textarea
                  name=""
                  id=""
                  className="w-full border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px] h-[120px]"
                ></textarea>
              </section>
            </div>


            <div className="grid grid-cols-2 gap-[20px]">
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Profile Image URL
                </label>
                <input
                  type="text"
                  placeholder="Enter profile Image URL"
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px]"
                />
              </section>
              <section className="flex flex-col">
                <label htmlFor="" className="font-bold">
                  Status *
                </label>
                <select
                  name=""
                  id=""
                  className="border-gray-200 rounded-md border-[2px] outline-none py-2 px-[10px] font-bold"
                >
                  <option value="">Active</option>
                </select>
              </section>
              
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateGuide;
