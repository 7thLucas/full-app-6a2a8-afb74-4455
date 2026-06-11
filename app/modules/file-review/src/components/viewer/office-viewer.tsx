interface OfficeViewerProps {
  url: string;
}

export function OfficeViewer({ url }: OfficeViewerProps) {
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  return (
    <iframe
      src={viewerUrl}
      className="w-full h-[70vh] rounded-md border"
      title="Document viewer"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
