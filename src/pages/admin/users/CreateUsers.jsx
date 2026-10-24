import React, { useState } from "react";
const CreateUsers = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    status: "Active",
  });

  const handleChnage = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
  }
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-black shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Create User</h1>
        <hr className="border-2 border-black mb-3" />

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <input
              value={formData.name}
              onChange={handleChnage}
              type="text"
              placeholder="Enter name"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input
              value={formData.email}
              onChange={handleChnage}
              type="email"
              placeholder="Enter email"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Phone</label>
            <input
              value={formData.phone}
              onChange={handleChnage}
              type="text"
              placeholder="Enter phone number"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              value={formData.password}
              onChange={handleChnage}
              type="password"
              placeholder="Enter password"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Confirm Password</label>
            <input
              value={formData.name}
              onChange={handleChnage}
              type="password"
              placeholder="Confirm password"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Status</label>

            {/* <select
              className="w-full border rounded-lg px-4 py-2"
              value={formData.status}
              onChange={handleChnage}
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select> */}
            <select
              className="w-full border rounded-lg px-4 py-2"
              name="status"
              value={formData.status}
              onChange={handleChnage}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            >
              Create User
            </button>

            <button
              type="button"
              className="bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400"
              onClick={() => {
                console.log("Cencel");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUsers;
