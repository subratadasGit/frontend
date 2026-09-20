import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INPUT } from "../ui/AppUI";
import { SearchIcon, CrossIcon } from "../Icon";
import { LEGEND, renderSchemaSvg } from "../../devtools/diagramSvg";
import { HEADER_HEIGHT, layoutSchema } from "../../devtools/transforms/prisma";

/**
 * The interactive ER diagram.
 *
 * Pan, zoom and drag are implemented directly on pointer events rather than
 * with a canvas library: the diagram is already an SVG string (so that export
 * and display cannot drift apart), and a transform on one wrapping group is
 * all the interaction needs. Pointer events also give pinch-zoom and touch
 * panning on phones for free, which a mouse-only implementation would not.
 */

const MIN_SCALE = 0.15;
const MAX_SCALE = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function DiagramCanvas({
  schema,
  onSvgChange,
  className = "",
  height = "32rem",
}) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const gestureRef = useRef(null);

  const [positions, setPositions] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  const layout = useMemo(
    () => layoutSchema(schema, { positions, collapsed }),
    [schema, positions, collapsed],
  );

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      layout.nodes
        .filter(
          (node) =>
            node.name.toLowerCase().includes(term) ||
            node.fields.some((field) => field.name.toLowerCase().includes(term)),
        )
        .map((node) => node.name),
    );
  }, [query, layout.nodes]);

  const svg = useMemo(
    () => renderSchemaSvg(layout, { highlight, matches }),
    [layout, highlight, matches],
  );

  // Hand the current SVG upward so the export menu always ships what is shown.
  useEffect(() => {
    onSvgChange?.(svg);
  }, [svg, onSvgChange]);

  /* ------------------------------ View controls ---------------------------- */

  const fit = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    const scale = clamp(
      Math.min(bounds.width / layout.width, bounds.height / layout.height) * 0.92,
      MIN_SCALE,
      1,
    );
    setTransform({
      scale,
      x: (bounds.width - layout.width * scale) / 2,
      y: (bounds.height - layout.height * scale) / 2,
    });
  }, [layout.width, layout.height]);

  const zoomBy = (factor) => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    setTransform((current) => {
      const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
      // Zoom about the centre of the viewport, not the origin.
      const centreX = bounds.width / 2;
      const centreY = bounds.height / 2;
      return {
        scale,
        x: centreX - ((centreX - current.x) / current.scale) * scale,
        y: centreY - ((centreY - current.y) / current.scale) * scale,
      };
    });
  };

  const reset = () => {
    setPositions({});
    setCollapsed({});
    setHighlight(null);
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Fit once the container has a size, and again whenever it resizes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fit]);

  /* -------------------------------- Gestures ------------------------------- */

  /** Converts a client point into diagram coordinates. */
  const toDiagram = (clientX, clientY) => {
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - bounds.left - transform.x) / transform.scale,
      y: (clientY - bounds.top - transform.y) / transform.scale,
    };
  };

  const onPointerDown = (event) => {
    const container = containerRef.current;
    if (!container) return;

    const point = toDiagram(event.clientX, event.clientY);
    // Topmost node under the pointer wins, matching paint order.
    const node = [...layout.nodes]
      .reverse()
      .find(
        (entry) =>
          point.x >= entry.x &&
          point.x <= entry.x + entry.width &&
          point.y >= entry.y &&
          point.y <= entry.y + entry.height,
      );

    event.currentTarget.setPointerCapture(event.pointerId);

    if (node) {
      // A click on the header row toggles collapse; anywhere else drags.
      const onHeader = point.y <= node.y + HEADER_HEIGHT;
      gestureRef.current = {
        kind: "node",
        node: node.name,
        onHeader,
        moved: false,
        offsetX: point.x - node.x,
        offsetY: point.y - node.y,
      };
    } else {
      gestureRef.current = {
        kind: "pan",
        startX: event.clientX - transform.x,
        startY: event.clientY - transform.y,
      };
    }
  };

  const onPointerMove = (event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.kind === "pan") {
      setTransform((current) => ({
        ...current,
        x: event.clientX - gesture.startX,
        y: event.clientY - gesture.startY,
      }));
      return;
    }

    const point = toDiagram(event.clientX, event.clientY);
    gesture.moved = true;
    setPositions((current) => ({
      ...current,
      [gesture.node]: {
        x: Math.round(point.x - gesture.offsetX),
        y: Math.round(point.y - gesture.offsetY),
      },
    }));
  };

  const onPointerUp = (event) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!gesture || gesture.kind !== "node") return;

    if (!gesture.moved) {
      if (gesture.onHeader) {
        setCollapsed((current) => ({ ...current, [gesture.node]: !current[gesture.node] }));
      } else {
        setHighlight((current) => (current === gesture.node ? null : gesture.node));
      }
    }
  };

  const onWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 50) {
      // A plain trackpad scroll pans, which is what people expect on a canvas.
      setTransform((current) => ({
        ...current,
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      }));
      return;
    }
    const bounds = containerRef.current.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    setTransform((current) => {
      const scale = clamp(current.scale * (event.deltaY < 0 ? 1.1 : 0.9), MIN_SCALE, MAX_SCALE);
      return {
        scale,
        x: pointerX - ((pointerX - current.x) / current.scale) * scale,
        y: pointerY - ((pointerY - current.y) / current.scale) * scale,
      };
    });
  };

  /* ------------------------------- Fullscreen ------------------------------ */

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const jumpTo = (name) => {
    const node = layout.nodes.find((entry) => entry.name === name);
    const container = containerRef.current;
    if (!node || !container) return;
    const bounds = container.getBoundingClientRect();
    setHighlight(name);
    setTransform((current) => ({
      scale: current.scale,
      x: bounds.width / 2 - (node.x + node.width / 2) * current.scale,
      y: bounds.height / 2 - (node.y + node.height / 2) * current.scale,
    }));
  };

  const body = (
    <div
      className={`relative flex flex-col overflow-hidden border border-white/[0.08] bg-[#050505] ${className}`}
      style={fullscreen ? undefined : { height }}
    >
      {/* Search + legend */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] bg-[#0a0a0a] px-3 py-2">
        <div className="relative min-w-[12rem] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-white/30">
            <SearchIcon style="w-3.5 h-3.5" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models and fields…"
            aria-label="Search the diagram"
            className={`${INPUT} !py-1.5 pl-8 !text-xs`}
          />
        </div>

        {matches && matches.size > 0 ? (
          <div className="flex flex-wrap gap-1">
            {[...matches].slice(0, 6).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => jumpTo(name)}
                className="border border-white/10 px-2 py-1 font-mono text-[0.625rem] text-white/60 transition-colors hover:border-[#ff4d1c] hover:text-[#ff4d1c]"
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {LEGEND.map((entry) => (
            <span key={entry.label} className="flex items-center gap-1 text-[0.625rem] text-white/40">
              <span style={{ color: entry.color }} aria-hidden="true">
                {entry.glyph}
              </span>
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        role="application"
        aria-label="Entity relationship diagram. Drag to pan, scroll to zoom, click a model to highlight its relations."
        className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      >
        <div
          ref={viewportRef}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            width: layout.width,
            height: layout.height,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {/* Floating toolbar */}
        <div className="absolute right-3 bottom-3 flex items-center gap-px border border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
          <ToolbarButton label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
            −
          </ToolbarButton>
          <span className="w-12 border-x border-white/10 py-1.5 text-center font-mono text-[0.625rem] text-white/50 tabular-nums">
            {Math.round(transform.scale * 100)}%
          </span>
          <ToolbarButton label="Zoom in" onClick={() => zoomBy(1.25)}>
            +
          </ToolbarButton>
          <ToolbarButton label="Fit to screen" onClick={fit}>
            Fit
          </ToolbarButton>
          <ToolbarButton label="Reset layout and zoom" onClick={reset}>
            Reset
          </ToolbarButton>
          <ToolbarButton
            label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={() => setFullscreen((current) => !current)}
          >
            {fullscreen ? "✕" : "⛶"}
          </ToolbarButton>
        </div>

        {highlight ? (
          <div className="absolute top-3 left-3 flex items-center gap-2 border border-[#ff4d1c]/40 bg-[#0a0a0a]/95 px-3 py-1.5 backdrop-blur">
            <span className="font-mono text-[0.625rem] tracking-[0.14em] text-[#ff4d1c] uppercase">
              {highlight}
            </span>
            <button
              type="button"
              onClick={() => setHighlight(null)}
              aria-label="Clear highlight"
              className="text-white/40 transition-colors hover:text-white"
            >
              <CrossIcon style="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="border-t border-white/[0.08] bg-[#0a0a0a] px-3 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] text-white/25 uppercase">
        Drag canvas to pan · drag a model to move it · click a title to collapse · click a body to
        highlight relations
      </p>
    </div>
  );

  if (!fullscreen) return body;

  return (
    <div className="fixed inset-0 z-[80] bg-[#050505] p-3" role="dialog" aria-modal="true" aria-label="Diagram fullscreen">
      {body}
    </div>
  );
}

function ToolbarButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="px-2.5 py-1.5 font-mono text-[0.6875rem] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ff4d1c]"
    >
      {children}
    </button>
  );
}
