# @qb/review-workflow

Headless project lifecycle, invitation, transition, and capability policy module for document review products.

This module orchestrates review projects. It depends on `authentication` for identity/roles and `file-review` for guarded file/comment access. Dependency direction is one-way: `review-workflow` may call `file-review`, but `file-review` must never import from `review-workflow`.

## What it provides

- **Review project model** (`tbl_review_projects`) with agency owner, client members, status, deadline, and round number.
- **Invitation model** (`tbl_review_invitations`) for inviting clients by email/token.
- **Workflow status transitions** for draft, review, revision, and approval loops.
- **Project ownership and membership policy** for API access.
- **File-review policy wrapper routes** under `/api/review-workflow` that call `file-review` services after project access/status checks.
- **React hooks** for project lists, project detail, and invitations.
- **Capability helper** for deriving UI permissions from project status and global auth role.
- **Opinionated demo UI** under `src/components`, available by explicit source imports.

## Structure

```
review-workflow/
|-- index.ts
`-- src/
    |-- components/
    |   |-- invite/
    |   |-- project-detail/
    |   |-- project-list/
    |   `-- workflow/
    |-- controllers/
    |-- hooks/
    |-- models/
    |-- routes/
    |-- services/
    `-- types/
```

## Prerequisites

### 1. Module dependencies

This module depends on authentication and file-review:

```bash
npm install @qb/authentication @qb/file-review
```

When installed as local scaffold packages, these are declared in `app/modules/review-workflow/package.json`.

This module does not depend on `@qb/email`. Invitation records are created here, but email delivery is not owned by this module.

### 2. Auth middleware

Routes use `requireAuth` and `requireRole(UserRole.Agency)` from the authentication module. Do not recreate auth guards inside this module.

## Public API

```ts
import {
  useProjects,
  useProjectDetail,
  useInvitations,
  ProjectStatus,
  STATUS_LABEL,
  STATUS_COLOR,
  AGENCY_TRANSITIONS,
  CLIENT_TRANSITIONS,
  getReviewWorkflowCapabilities,
} from "@qb/review-workflow";
import type { ReviewWorkflowCapabilities } from "@qb/review-workflow";
```

The package root is client-safe. Server-only models and services are available by explicit source imports in server code.

Opinionated UI components are not exported from the package root. Import them explicitly only when the app wants the included demo UI:

```tsx
import { ProjectList } from "~/modules/review-workflow/src/components/project-list/project-list";
import { ProjectDetail } from "~/modules/review-workflow/src/components/project-detail/project-detail";
```

## Data models

### `ReviewProject` (`tbl_review_projects`)

| Field | Type | Notes |
|-------|------|-------|
| `title` | `string` | Project title |
| `description` | `string?` | Project notes or review brief |
| `agency_id` | `Ref<User>` | Agency owner |
| `client_ids` | `Ref<User>[]` | Clients with project access |
| `deadline` | `Date?` | Optional deadline |
| `status` | `ProjectStatus` | `draft`, `in_review`, `in_revision`, or `approved` |
| `round` | `number` | Starts at `1`; increments when agency resubmits after revision |

### `ReviewInvitation` (`tbl_review_invitations`)

| Field | Type | Notes |
|-------|------|-------|
| `project_id` | `string` | Review project ID |
| `email` | `string` | Invitee email |
| `token` | `string` | Acceptance token |
| `status` | `InvitationStatus` | `pending`, `accepted`, or `expired` |
| `expires_at` | `Date` | Token expiry |
| `accepted_by` | `Ref<User>?` | User who accepted |
| `accepted_at` | `Date?` | Acceptance timestamp |

## Status flow

```text
draft -> in_review -> approved
             |
             v
        in_revision -> in_review
```

| From | To | Actor | Button label |
|------|----|-------|--------------|
| `draft` | `in_review` | Agency | Send for Review |
| `in_review` | `in_revision` | Client | Request Revision |
| `in_review` | `approved` | Client | Approve |
| `in_revision` | `in_review` | Agency | Submit for Review |

The service increments `round` when moving from `in_revision` back to `in_review`.

## Capability helper

`getReviewWorkflowCapabilities(status, role)` centralizes UI policy:

```ts
const capabilities = getReviewWorkflowCapabilities(project.status, user.role);

capabilities.canViewFiles;
capabilities.canUpload;
capabilities.canAddRevision;
capabilities.canDeleteFile;
capabilities.canAnnotate;
capabilities.canComment;
capabilities.canApprove;
capabilities.canRequestRevision;
capabilities.transitions;
capabilities.readOnly;
```

Custom routes and UI should compose:

- data from `review-workflow` hooks
- file/comment state through guarded `review-workflow` endpoints backed by `file-review` services
- permission flags from `getReviewWorkflowCapabilities`
- app-owned UI components

## API routes

Mounted under `/api/review-workflow`:

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `GET` | `/projects` | Auth | List projects visible to the user |
| `POST` | `/projects` | Agency | Create project |
| `GET` | `/projects/:projectId` | Auth | Get project detail |
| `PATCH` | `/projects/:projectId` | Agency owner | Update editable fields |
| `DELETE` | `/projects/:projectId` | Agency owner | Soft-delete project |
| `PATCH` | `/projects/:projectId/status` | Auth, transition actor checked | Transition status |
| `GET` | `/projects/:projectId/files` | Auth, project access/status checked | List current files through `file-review` |
| `POST` | `/projects/:projectId/files` | Agency owner/status checked | Save uploaded file metadata through `file-review` |
| `POST` | `/files/:fileId/revisions` | Agency owner/status checked | Add revision metadata through `file-review` |
| `GET` | `/files/:fileId/revisions` | Auth, project access/status checked | List revision chain |
| `DELETE` | `/files/:fileId` | Agency owner/status checked | Delete file chain |
| `GET` | `/files/:fileId/comments` | Auth, project access/status checked | List comments |
| `POST` | `/files/:fileId/comments` | Auth, project access/status checked | Create comment if capabilities allow |
| `PATCH` | `/comments/:commentId` | Auth, author/project access checked | Edit own comment |
| `DELETE` | `/comments/:commentId` | Auth, author/project access checked | Delete own comment |
| `PATCH` | `/comments/:commentId/resolve` | Auth, project access/status checked | Toggle resolve |
| `GET` | `/projects/:projectId/clients/search?q=` | Agency owner | Search client users |
| `POST` | `/projects/:projectId/clients` | Agency owner | Add client by user ID |
| `DELETE` | `/projects/:projectId/clients/:userId` | Agency owner | Remove client |
| `POST` | `/projects/:projectId/invitations` | Agency owner | Create invitation token |
| `GET` | `/projects/:projectId/invitations` | Project access | List invitations |
| `DELETE` | `/invitations/:invitationId` | Agency owner | Revoke invitation |
| `GET` | `/invitations/accept/:token` | Public | Validate invitation token |
| `POST` | `/invitations/accept/:token` | Auth | Accept invitation |

All responses follow `{ success: boolean, data?: unknown, message?: string }`.

## React hooks

```ts
const { projects, loading, error, createProject, refetch } = useProjects();

const { project, loading, refetch } = useProjectDetail(projectId);

const {
  invitations,
  sendInvitation,
  revokeInvitation,
} = useInvitations(projectId);
```

## Demo UI usage

The scaffold includes project list/detail and invite components for the default DocReview app:

```tsx
import { ProjectList } from "~/modules/review-workflow/src/components/project-list/project-list";
import { ProjectDetail } from "~/modules/review-workflow/src/components/project-detail/project-detail";

<ProjectList projects={projects} loading={loading} isAgency={isAgency} />;

<ProjectDetail
  project={project}
  isAgency={isAgency}
  currentUserId={user.id}
  onRefetch={refetch}
/>;
```

`ProjectDetail` uses `file-review` UI and hooks, but routes file/comment actions through `/api/review-workflow` so project access and status policy are enforced server-side.

## Server-side services

```ts
import { ReviewProjectService } from "~/modules/review-workflow/src/services/review-project.service";
import { ReviewInvitationService } from "~/modules/review-workflow/src/services/review-invitation.service";
```

Use explicit source imports for services and models in server code. Do not import server-only Typegoose models through the package root.

## Boundaries

- Reuse `authentication` for identity, roles, `req.user`, `requireAuth`, and `requireRole`.
- Depend on `file-review` for file/comment services, but keep the dependency one-way.
- Keep auth, ownership, membership, and status policy here; do not spread those checks into `file-review`.
- Do not depend on `@qb/email`.
- Do not export Typegoose models from the package root.
- Do not import `*.model.ts` files from React components or hooks.
