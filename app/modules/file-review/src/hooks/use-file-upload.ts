import { useState } from "react";
import { apiRequest } from "~/lib/api.client";

const MIME_TO_FILE_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "image", "image/jpeg": "image", "image/gif": "image",
  "image/webp": "image", "image/svg+xml": "image",
  "video/mp4": "video", "video/webm": "video", "video/quicktime": "video",
};

function resolveFileType(mime: string): string {
  return MIME_TO_FILE_TYPE[mime] ?? "office";
}

function resolveUploadType(mime: string): "image" | "document" {
  return mime.startsWith("image/") ? "image" : "document";
}

export interface UploadedFileResult {
  fileUrl: string;
  fileName: string;
}

export interface UseFileUploadOptions {
  onError?: (message: string, error: unknown) => void;
  metadataBasePath?: string;
}

export function useFileUpload(projectId: string, options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const metadataBasePath = options.metadataBasePath ?? "/api/file-review";

  async function upload(file: File): Promise<UploadedFileResult> {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: upload file to uploader service (XHR for progress)
      const type = resolveUploadType(file.type);
      const uploadResult = await new Promise<{ url: string; file_id: string; size: number; mimeType: string }>(
        (resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.data) resolve(res.data);
              else reject(new Error(res.message ?? "Upload failed"));
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("POST", `/api/uploader/${type}`);
          xhr.withCredentials = true;
          xhr.send(formData);
        }
      );

      setProgress(95);

      // Step 2: save metadata to file-review
      const res = await apiRequest<any>(`${metadataBasePath}/projects/${projectId}/files`, {
        method: "POST",
        data: {
          file_url: uploadResult.url,
          file_name: file.name,
          file_size_bytes: uploadResult.size ?? file.size,
          file_type: resolveFileType(uploadResult.mimeType ?? file.type),

        },
      });

      if (!res.success) throw new Error(res.message ?? "Failed to save file");

      setProgress(100);
      return { fileUrl: res.data.file_url, fileName: res.data.file_name };
    } catch (e: any) {
      const msg = e.message || "Upload failed";
      setError(msg);
      options.onError?.(msg, e);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  async function addRevision(fileId: string, file: File): Promise<any> {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: upload file
      const type = resolveUploadType(file.type);
      const uploadResult = await new Promise<{ url: string; file_id: string; size: number; mimeType: string }>(
        (resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.data) resolve(res.data);
              else reject(new Error(res.message ?? "Upload failed"));
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("POST", `/api/uploader/${type}`);
          xhr.withCredentials = true;
          xhr.send(formData);
        }
      );

      setProgress(95);

      // Step 2: save revision metadata
      const res = await apiRequest<any>(`${metadataBasePath}/files/${fileId}/revisions`, {
        method: "POST",
        data: {
          file_url: uploadResult.url,
          file_name: file.name,
          file_size_bytes: uploadResult.size ?? file.size,
          file_type: resolveFileType(uploadResult.mimeType ?? file.type),

        },
      });

      if (!res.success) throw new Error(res.message ?? "Failed to save revision");

      setProgress(100);
      return res.data;
    } catch (e: any) {
      const msg = e.message || "Upload failed";
      setError(msg);
      options.onError?.(msg, e);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { upload, addRevision, uploading, progress, error };
}
