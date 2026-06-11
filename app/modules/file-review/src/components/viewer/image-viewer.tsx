interface ImageViewerProps {
  url: string;
  zoom: number;
}

export function ImageViewer({ url, zoom }: ImageViewerProps) {
  return (
    <div className="flex items-center justify-center overflow-hidden">
      <img
        src={url}
        alt="Review file"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center top", transition: "transform 0.15s ease" }}
        className="max-w-full"
        draggable={false}
      />
    </div>
  );
}
