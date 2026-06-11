import { useState, useEffect, useRef } from "react";

interface PdfViewerProps {
  url: string;
  page: number;
  zoom: number;
  onDocumentLoad: (totalPages: number) => void;
  onPageChange: (page: number) => void;
}

export function PdfViewer({ url, page, zoom, onDocumentLoad }: PdfViewerProps) {
  const [totalPages, setTotalPages] = useState(0);
  const [PdfComponents, setPdfComponents] = useState<{ Document: any; Page: any } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Dynamic import keeps pdfjs-dist out of the SSR bundle (Node lacks DOMMatrix).
    // Vite's optimizeDeps.include ensures this resolves to the same React instance
    // as the app — preventing the duplicate-React "useReducer of null" error.
    import("react-pdf").then((mod) => {
      const version = mod.pdfjs.version;
      mod.pdfjs.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      setPdfComponents({ Document: mod.Document, Page: mod.Page });
    });
  }, []);

  if (!PdfComponents) {
    return <div className="p-8 text-muted-foreground">Loading PDF viewer…</div>;
  }

  const { Document, Page } = PdfComponents;

  function onLoadSuccess({ numPages }: { numPages: number }) {
    setTotalPages(numPages);
    onDocumentLoad(numPages);
  }

  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
      loading={<div className="p-8 text-muted-foreground">Loading PDF…</div>}
    >
      <Page pageNumber={page} scale={zoom} renderTextLayer={false} renderAnnotationLayer={false} />
    </Document>
  );
}
