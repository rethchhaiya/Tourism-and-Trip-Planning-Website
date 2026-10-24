import React from "react";
import { Map, Ticket, Users, Wallet, TrendingUp, ArrowRight } from "lucide-react";

const iconConfig = {
  map: { Icon: Map, bg: "bg-[#e4e2fb]", color: "text-[#3930d8]" },
  ticket: { Icon: Ticket, bg: "bg-[#e4e2fb]", color: "text-[#3930d8]" },
  users: { Icon: Users, bg: "bg-[#e4e2fb]", color: "text-[#3930d8]" },
  money: { Icon: Wallet, bg: "bg-[#d7f6e9]", color: "text-[#08745b]" },
};

const StatCard = ({ title, value, change, icon, positive = false }) => {
  const { Icon, bg, color } = iconConfig[icon] || {};

  return (
    <div className="flex min-h-[112px] items-center justify-between rounded-md border border-[#e1e3ec] bg-white p-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-[#656a78]">{title}</p>
        <h2 className="mb-2 text-[26px] font-bold leading-none text-[#1d2433]">
          {value}
        </h2>
        <div
          className={`flex items-center gap-1 text-xs ${
            positive ? "text-[#08745b]" : "text-[#555a6b]"
          }`}
        >
          {positive ? <TrendingUp size={15} /> : <ArrowRight size={15} />}
          <span>{change}</span>
        </div>
      </div>
      <div
        className={`flex h-[52px] w-[52px] items-center justify-center rounded-[13px] ${bg} ${color}`}
      >
        {Icon && <Icon size={27} />}
      </div>
    </div>
  );
};

export default StatCard;