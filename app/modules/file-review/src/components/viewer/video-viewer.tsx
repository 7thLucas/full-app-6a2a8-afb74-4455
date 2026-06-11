interface VideoViewerProps {
  url: string;
}

export function VideoViewer({ url }: VideoViewerProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <video
        src={url}
        controls
        className="max-w-full max-h-[70vh] rounded-md shadow"
      />
    </div>
  );
}
