# @qb/file-review

Standalone file review engine for storing file metadata, revision history, comments, replies, and document annotations.

This module is independent from `review-workflow`, but it uses `authentication` for user identity. It does not know project status names, client membership, invitations, or Agency/Client workflow policy. It delegates file byte storage to `@qb/uploader`.

## What it provides

- **Project file records** (`tbl_project_files`) with revision chains and latest-version filtering.
- **Review comments** (`tbl_review_comments`) with text comments, pin annotations, video timestamp comments, replies, and resolve state.
- **Authenticated attribution** through `uploaded_by`, `author_id`, and `resolved_by`.
- **REST API endpoints** for file metadata, revisions, comments, delete, and resolve actions.
- **React hooks** for listing files, listing comments, and running the two-step upload flow.
- **Annotation primitives** for drawing and rendering percentage-based regions over PDF/image viewers.
- **Opinionated demo UI** under `src/components`, available by explicit source imports.

## Structure

```
file-review/
|-- index.ts
`-- src/
    |-- components/
    |   |-- annotations/
    |   |-- comments/
    |   |-- file-grid/
    |   |-- file-viewer/
    |   `-- viewer/
    |-- controllers/
    |-- hooks/
    |-- models/
    |-- routes/
    |-- services/
    `-- types/
```

## Prerequisites

### 1. Module dependencies

This module depends on authentication for identity and uploader for file type/storage metadata:

```bash
npm install @qb/authentication @qb/uploader
```

When installed as local scaffold packages, these are declared in `app/modules/file-review/package.json`.

### 2. PDF viewer packages

The PDF viewer primitive uses a client-only dynamic import of `react-pdf`:

```bash
npm install react-pdf pdfjs-dist
```

`pdfjs-dist` must remain out of the SSR bundle because it requires browser-only APIs such as `DOMMatrix`.

### 3. Auth middleware

The API routes expect `requireAuth` and `requireRole` from the authentication module. Do not recreate auth middleware inside this module.

## Public API

```ts
import {
  useProjectFiles,
  useFileComments,
  useFileUpload,
  AnnotationLayer,
  AnnotationRegion,
  CommentType,
  FileType,
} from "@qb/file-review";
import type { Region, UseFileUploadOptions } from "@qb/file-review";
```

The package root is client-safe. Server-only models and services are available by explicit source imports in server code.

Opinionated UI components are not exported from the package root. Import them explicitly only when the app wants the included demo UI:

```tsx
import { FileGrid } from "~/modules/file-review/src/components/file-grid/file-grid";
import { CommentList } from "~/modules/file-review/src/components/comments/comment-list";
```

## Data models

### `ProjectFile` (`tbl_project_files`)

| Field | Type | Notes |
|-------|------|-------|
| `project_id` | `string` | Plain project identifier; no dependency on `review-workflow` model |
| `file_url` | `string` | URL returned by `@qb/uploader` |
| `file_name` | `string` | Display filename; preserved across revisions |
| `file_size_bytes` | `number?` | Optional size from upload metadata |
| `file_type` | `FileType` | `pdf`, `image`, `video`, or `office` |
| `uploaded_by` | `Ref<User>` | Authenticated user who saved the metadata record |
| `revision` | `number` | Starts at `1` |
| `root_file_id` | `string?` | Points revision 2+ back to the root file |
| `is_current` | `boolean` | Only current revisions show in the grid |

### `ReviewComment` (`tbl_review_comments`)

| Field | Type | Notes |
|-------|------|-------|
| `project_file_id` | `Ref<ProjectFile>` | File or revision being commented on |
| `content` | `string` | Comment body |
| `author_id` | `Ref<User>` | Authenticated author |
| `comment_type` | `CommentType` | `text`, `pin`, or `video_timestamp` |
| `x`, `y`, `width`, `height` | `number?` | Pin region coordinates as percentages |
| `page` | `number?` | PDF page for pin annotations |
| `pin_number` | `number?` | Auto-assigned per file for top-level pin comments |
| `timestamp_seconds` | `number?` | Video timestamp comments |
| `parent_id` | `Ref<ReviewComment>?` | Reply parent |
| `resolved` | `boolean` | Resolve state |
| `resolved_by` | `Ref<User>?` | User who resolved the comment |
| `resolved_at` | `Date?` | Resolve timestamp |

## API routes

Mounted under `/api/file-review`:

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `GET` | `/projects/:projectId/files` | Auth | List current revisions for a project |
| `POST` | `/projects/:projectId/files` | Agency | Save file metadata after uploader upload |
| `POST` | `/files/:fileId/revisions` | Agency | Save a new revision metadata record |
| `GET` | `/files/:fileId/revisions` | Auth | List the full revision chain |
| `DELETE` | `/files/:fileId` | Agency | Soft-delete all revisions in the chain |
| `GET` | `/files/:fileId/comments` | Auth | List comments for a file or revision |
| `POST` | `/files/:fileId/comments` | Auth | Create text, pin, or video timestamp comment |
| `PATCH` | `/comments/:commentId` | Auth | Edit own comment content |
| `DELETE` | `/comments/:commentId` | Auth | Soft-delete own comment |
| `PATCH` | `/comments/:commentId/resolve` | Auth | Toggle resolved state |

All responses follow `{ success: boolean, data?: unknown, message?: string }`.

Reference fields stay scalar in API responses:

```ts
file.uploaded_by; // string user id
file.uploader;    // optional populated display user

comment.author_id;   // string user id
comment.author;      // optional populated display user
comment.resolved_by; // optional string user id
comment.resolver;    // optional populated display user
```

Use `review-workflow` routes for product flows that also require project membership, ownership, or status policy.

## Upload flow

File creation is metadata-only. Upload bytes first through `@qb/uploader`, then save metadata:

```ts
await apiRequest(`/api/file-review/projects/${projectId}/files`, {
  method: "POST",
  data: {
    file_url: uploadResult.url,
    file_name: file.name,
    file_size_bytes: uploadResult.size,
    file_type: FileType.Pdf,
  },
});
```

The included `useFileUpload(projectId)` hook performs this two-step flow:

1. `POST /api/uploader/:type` with multipart `file`.
2. `POST /api/file-review/projects/:projectId/files` with returned metadata.

## React hooks

```ts
const { files, loading, error, refetch } = useProjectFiles(projectId);

const {
  comments,
  addComment,
  resolveComment,
  deleteComment,
  refetch,
} = useFileComments(fileId);

const { upload, addRevision, uploading, progress, error } = useFileUpload(projectId, {
  metadataBasePath: "/api/file-review",
  onError: (message) => {
    // User apps decide how to show feedback, for example useToast().
  },
});
```

`useFileUpload` does not import app UI. It returns error state, throws failures to the caller, and accepts an optional `onError` callback.

## Annotation flow

`AnnotationLayer` emits and renders region coordinates as percentages of the rendered document container:

```ts
type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

Typical flow:

1. Product UI enables annotation mode.
2. User drags a region over a PDF/image.
3. `AnnotationLayer` emits `{ x, y, width, height }`.
4. UI submits a `pin` comment with the region and optional PDF `page`.
5. Server assigns `pin_number`.
6. Existing comments render back through `AnnotationLayer`.

## Server-side services

```ts
import { ProjectFileService } from "~/modules/file-review/src/services/project-file.service";
import { ReviewCommentService } from "~/modules/file-review/src/services/review-comment.service";
```

Use explicit source imports for services and models in server code. Do not import server-only Typegoose models through the package root.

## Boundaries

- Do not import from `review-workflow`.
- Use `authentication` only for identity/author attribution, not workflow policy.
- Use `@qb/authentication` only for client-safe/public auth APIs such as `UserRole` and shared types.
- Import server-only auth internals explicitly by path, for example `~/modules/authentication/authentication.model` or `~/modules/authentication/authentication.middleware`.
- Do not export or import Typegoose models through package roots; keep model imports visibly server-only.
- Do not configure multer here.
- Do not import `*.model.ts` files from React components or hooks.
- Use `CommentType` from `src/types/comment.types.ts` or the package root.
- Use `FileType` from `@qb/uploader` or this package root.
