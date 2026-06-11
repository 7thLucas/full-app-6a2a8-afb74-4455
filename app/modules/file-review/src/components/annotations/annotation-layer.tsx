import { useRef, useState } from "react";
import { AnnotationRegion } from "./annotation-region";

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Annotation {
  _id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  page?: number;
  pin_number?: number;
  resolved: boolean;
}

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentPage: number;
  activeCommentId?: string | null;
  canAnnotate: boolean;
  annotating: boolean;
  onAnnotationClick: (commentId: string) => void;
  onRegionDraw: (region: Region) => void;
}

export function AnnotationLayer({
  annotations, currentPage, activeCommentId, canAnnotate, annotating, onAnnotationClick, onRegionDraw,
}: AnnotationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop drag state
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Region | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Mobile two-tap state: null = waiting for first tap, set = waiting for second tap
  const [tapStart, setTapStart] = useState<{ x: number; y: number } | null>(null);

  const drawingEnabled = canAnnotate && annotating;

  const regions = annotations.filter(
    (a) => a.x !== undefined && a.y !== undefined && (a.page === undefined || a.page === currentPage)
  );

  function toPercent(clientX: number, clientY: number): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }

  // ── Desktop mouse events ──────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawingEnabled) return;
    if ((e.target as HTMLElement).closest("[data-annotation]")) return;
    e.preventDefault();
    const pos = toPercent(e.clientX, e.clientY);
    startRef.current = pos;
    setDragging(true);
    setPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawingEnabled || !dragging || !startRef.current) return;
    const cur = toPercent(e.clientX, e.clientY);
    setPreview({
      x: Math.min(startRef.current.x, cur.x),
      y: Math.min(startRef.current.y, cur.y),
      width: Math.abs(cur.x - startRef.current.x),
      height: Math.abs(cur.y - startRef.current.y),
    });
  }

  function onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging || !startRef.current || !preview) {
      setDragging(false);
      setPreview(null);
      return;
    }
    setDragging(false);
    const cur = toPercent(e.clientX, e.clientY);
    const region: Region = {
      x: Math.min(startRef.current.x, cur.x),
      y: Math.min(startRef.current.y, cur.y),
      width: Math.abs(cur.x - startRef.current.x),
      height: Math.abs(cur.y - startRef.current.y),
    };
    setPreview(null);
    startRef.current = null;
    if (region.width > 1 && region.height > 1) {
      onRegionDraw(region);
    }
  }

  // ── Mobile two-tap: tap once to set start corner, tap again to set end ───

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!drawingEnabled) return;
    if ((e.target as HTMLElement).closest("[data-annotation]")) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const pos = toPercent(touch.clientX, touch.clientY);

    if (!tapStart) {
      // First tap — set start corner, show a small marker via preview
      setTapStart(pos);
      setPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else {
      // Second tap — compute region and emit
      const region: Region = {
        x: Math.min(tapStart.x, pos.x),
        y: Math.min(tapStart.y, pos.y),
        width: Math.abs(pos.x - tapStart.x),
        height: Math.abs(pos.y - tapStart.y),
      };
      setTapStart(null);
      setPreview(null);
      if (region.width > 1 && region.height > 1) {
        onRegionDraw(region);
      } else {
        // Tapped same spot twice — reset
        setTapStart(null);
        setPreview(null);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{
        cursor: drawingEnabled ? (tapStart ? "crosshair" : "cell") : "default",
        pointerEvents: drawingEnabled ? "auto" : "none",
        touchAction: drawingEnabled ? "none" : "auto",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { if (dragging) { setDragging(false); setPreview(null); } }}
      onTouchEnd={onTouchEnd}
    >
      {/* Existing annotation regions */}
      <div style={{ pointerEvents: "auto" }}>
        {regions.map((a) => (
          <AnnotationRegion
            key={a._id}
            number={a.pin_number ?? 0}
            x={a.x!}
            y={a.y!}
            width={a.width ?? 8}
            height={a.height ?? 5}
            resolved={a.resolved}
            active={activeCommentId === a._id}
            onClick={() => onAnnotationClick(a._id)}
          />
        ))}
      </div>

      {/* First tap marker (mobile) */}
      {tapStart && !dragging && (
        <div
          style={{
            position: "absolute",
            left: `${tapStart.x}%`,
            top: `${tapStart.y}%`,
            transform: "translate(-50%, -50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#3b82f6",
            border: "2px solid white",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Live drag preview (desktop) or tap preview */}
      {preview && (preview.width > 0.5 || preview.height > 0.5) && (
        <div
          style={{
            position: "absolute",
            left: `${preview.x}%`,
            top: `${preview.y}%`,
            width: `${Math.max(preview.width, 0.5)}%`,
            height: `${Math.max(preview.height, 0.5)}%`,
            border: "2px dashed #3b82f6",
            backgroundColor: "rgba(59,130,246,0.08)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
