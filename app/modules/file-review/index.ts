// Low-level annotation primitives
export { AnnotationLayer } from "./src/components/annotations/annotation-layer";
export type { Region } from "./src/components/annotations/annotation-layer";
export { AnnotationRegion } from "./src/components/annotations/annotation-region";

// Hooks
export { useProjectFiles } from "./src/hooks/use-project-files";
export type { UseProjectFilesOptions } from "./src/hooks/use-project-files";
export { useFileComments } from "./src/hooks/use-file-comments";
export type { UseFileCommentsOptions } from "./src/hooks/use-file-comments";
export { useFileUpload } from "./src/hooks/use-file-upload";
export type { UploadedFileResult, UseFileUploadOptions } from "./src/hooks/use-file-upload";

// Types
export { FileType } from "@qb/uploader";
export { CommentType } from "./src/types/comment.types";

// Opinionated demo UI remains available by explicit subpath imports under src/components.
