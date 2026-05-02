import React from "react";
import { Link } from "react-router-dom";

const Card = ({ feature }) => {
  return (
    <Link to={feature.link}>
      <div className="shadow-xl bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div
          className={`bg-gradient-to-br ${feature.gradient} p-8 min-h-[230px]`}
        >
          <div className="flex bg-white items-center justify-center mb-2 w-16 h-16 rounded-full">
            {feature.icon}
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">
            {feature.title}
          </h3>
          <p className="text-white/90">{feature.description}</p>
        </div>
        <div className="p-6">
          <button
            className={`bg-gradient-to-br ${feature.gradient} px-6 py-3 rounded-lg text-white w-full block text-center font-semibold hover:opacity-90 transition-opacity`}
          >
            Get Started →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default Card;