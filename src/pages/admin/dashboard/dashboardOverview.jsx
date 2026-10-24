import React from "react";
import StatCard from "../../../components/admin/dashboard/StatCard";
import RevenueOverview from "../../../components/admin/dashboard/RevenueOverview";
import BookingStatistics from "../../../components/booking/BookingStatistics";
import RecentBookings from "../../../components/booking/RecentBookings";

const STAT_CARDS = [
  {
    title: "Total Bookings",
    value: "2,846",
    change: "+12.5% from last month",
    icon: "ticket",
    positive: true,
  },
  {
    title: "Active Tours",
    value: "128",
    change: "+8 new this week",
    icon: "map",
    positive: true,
  },
  {
    title: "Customer Base",
    value: "18.4K",
    change: "+2.1% this month",
    icon: "users",
    positive: true,
  },
  {
    title: "Total Revenue",
    value: "$84.2K",
    change: "-1.8% vs last month",
    icon: "money",
    positive: false,
  },
];

const DashboardOverview = () => {
  return (
    <div className="min-h-screen bg-[#f4f6fb] p-6">
      <div className="mb-6">
        <h1 className="text-[30px] font-bold text-[#1d2433]">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-[#656a78]">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.8fr_1fr]">
        <RevenueOverview />
        <BookingStatistics />
      </div>

      <div className="mt-6">
        <RecentBookings />
      </div>
    </div>
  );
};

export default DashboardOverview;
