# Approova — Client Review & Approval Platform

## Brand
- Name: Approova
- Tagline: "Where approvals happen."
- Tone: Professional, clean, efficient — built for creative agencies and their clients

## Users
Two distinct roles:

### Agency User (internal team)
- Project managers, creative directors, account managers
- Can: create projects, upload deliverables, invite clients, request reviews, manage revision rounds, view all feedback, mark items approved/rejected, track activity

### Client User (external reviewer)
- Brand managers, marketing directors at client companies
- Can: view shared deliverables, leave comments with annotations, request revisions, approve or reject deliverables, view revision history

## Authentication
- Email/password login
- Google OAuth login
- Role selection on signup (Agency or Client)
- Client users can be invited via email link

## Core Features

### Project Management
- Create projects with name, description, deadline, client
- Project dashboard showing all deliverables and their review status
- Project-level activity timeline

### File Management & Sharing
- Upload files: images (JPG, PNG, GIF, WebP), videos (MP4, MOV), documents (PDF), presentations (PPT, PPTX), and other assets
- Secure file sharing — clients only see what they're invited to
- File versioning: upload new versions of the same file
- Version history with timestamps and uploader info

### Review Workspace
- Each project has a dedicated review workspace
- Files displayed in a clean grid/list view with review status badges
- Open any file to enter the review view
- Review status: Pending Review → In Review → Revision Requested → Approved / Rejected

### Annotations & Comments
- Visual annotations on images: click to place a pin comment anywhere on the image
- PDF annotations: click to comment on specific parts of a document
- Video feedback with timestamps: leave comments at specific video timestamps
- Threaded discussions on each comment
- Resolve/unresolve comments

### Approval Workflow
- Request review from client (sends email notification)
- Client can: Approve, Request Revision, or Reject
- Revision requests trigger a new review round
- Approval locks the file version
- Overall project approval status tracks all deliverables

### Revision Tracking
- Each review round is numbered (Round 1, Round 2, etc.)
- Round history visible on each file
- Compare versions side-by-side (for images)

### Notifications & Activity
- In-app notification bell
- Email notifications for: new review requests, comments, approvals, revision requests
- Activity timeline per project showing all actions chronologically

## Strategic Principles
- Replace scattered email/Slack feedback with one centralized workspace
- Speed up agency project delivery
- Reduce misunderstandings through clear, contextual feedback
- Professional client experience that reflects well on the agency