function CreateCustomer() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Customers / Create Customer
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Create Customer
        </h1>

        <p className="text-gray-500">
          Add a new customer to your system
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Customer Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* First Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              placeholder="Enter last name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              type="tel"
              placeholder="+855 XX XXX XXX"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500">
              <option>Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              placeholder="Enter address"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              placeholder="Enter city"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              placeholder="Enter country"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              rows="4"
              placeholder="Enter additional notes..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end gap-3 border-t pt-5">
          <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>

          <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Create Customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCustomer;
