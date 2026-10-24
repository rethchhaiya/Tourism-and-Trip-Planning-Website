const HighLightCompo = ({ icon, visit, txtPara }) => {
  return (
    <div className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100">
      <div
        className="
        w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12

        flex items-center justify-center

        rounded-lg md:rounded-xl

        bg-emerald-200
        text-emerald-600

        mb-3 md:mb-5

        group-hover:scale-110
        transition-all duration-300
        "
      >
        {icon}
      </div>

      <h2 className="text-sm lg:text-base font-bold text-slate-800 mb-2">
        {visit}
      </h2>

      <p className="text-xs lg:text-sm text-slate-500 leading-relaxed">
        {txtPara}
      </p>
    </div>
  );
};

export default HighLightCompo;

