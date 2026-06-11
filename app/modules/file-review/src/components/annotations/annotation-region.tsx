import { cn } from "~/lib/utils";

interface AnnotationRegionProps {
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  resolved: boolean;
  active: boolean;
  onClick: () => void;
}

export function AnnotationRegion({ number, x, y, width, height, resolved, active, onClick }: AnnotationRegionProps) {
  const borderColor = resolved ? "#22c55e" : active ? "#3b82f6" : "#f97316";
  const bgColor = resolved
    ? "rgba(34,197,94,0.08)"
    : active
    ? "rgba(59,130,246,0.12)"
    : "rgba(249,115,22,0.08)";

  return (
    <div
      data-annotation
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        cursor: "pointer",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      {/* Pin badge top-left */}
      <div
        className={cn(
          "absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow",
          resolved ? "bg-green-500" : active ? "bg-blue-500" : "bg-orange-500"
        )}
      >
        {number}
      </div>
    </div>
  );
}
