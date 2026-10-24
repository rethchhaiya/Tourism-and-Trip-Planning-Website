import React from "react";

const RevenueOverview = () => {
  const revenue = [
    { month: "Jan", height: "45%" },
    { month: "Feb", height: "60%" },
    { month: "Mar", height: "50%" },
    { month: "Apr", height: "78%", active: true },
    { month: "May", height: "65%" },
    { month: "Jun", height: "88%" },
    { month: "Jul", height: "55%" },
  ];

  return (
    <section className="overflow-hidden rounded-md border border-[#e1e3ec] bg-white">
      <div className="flex min-h-[72px] items-center justify-between border-b border-[#e1e3ec] px-5">
        <h2 className="text-[17px] font-semibold text-[#1d2433]">
          Revenue Overview
        </h2>
        <button className="rounded border border-[#c8cad8] bg-white px-3 py-1.5 text-sm text-[#252b3a]">
          This Year
        </button>
      </div>
      <div className="h-[315px] px-5 pb-5 pt-8">
        <div className="relative h-full">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[1, 2, 3, 4, 5].map((line) => (
              <div key={line} className="border-t border-[#eeeef5]" />
            ))}
          </div>
          <div className="relative flex h-full items-end justify-between gap-2">
            {revenue.map((item) => (
              <div
                key={item.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className={`w-full max-w-[75px] rounded-t-[3px] ${
                    item.active ? "bg-[#3930d8]" : "bg-[#d7d4f5]"
                  }`}
                  style={{ height: item.height }}
                />
                <span className="text-xs text-[#8a8fa3]">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueOverview;