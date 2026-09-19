import { Link } from "react-router-dom";

/**
 * Tool card used on the Content and Image hubs.
 *
 * Matches the landing page's feature cards: dark surface, hairline border that
 * warms on hover, numbered index, and an accent gradient sweeping in from the
 * top-left. `feature.index` is optional — it renders the 01/02 marker.
 */
const Card = ({ feature, index }) => {
  return (
    <Link
      to={feature.link}
      className="card group flex min-h-[15rem] flex-col justify-between p-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d1c]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs tracking-[0.2em] text-white/25">
          {String(index ?? 0).padStart(2, "0")}
        </span>
        <span className="text-[#ff4d1c] transition-transform duration-500 group-hover:scale-110">
          {feature.icon}
        </span>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-semibold tracking-[-0.025em]">
          {feature.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-white/55">
          {feature.description}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.16em] text-white/70 uppercase transition-colors group-hover:text-white">
          Open
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
};

export default Card;
