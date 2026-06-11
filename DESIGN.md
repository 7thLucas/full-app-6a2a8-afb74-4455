# Approova — Design System

## Personality
Professional, modern, clean. Think Figma meets Linear — creative but structured. Agencies and their clients need to trust this tool with real work; it must feel polished and intentional, not playful or experimental.

## Color Palette
- Primary: Deep indigo #4F46E5 (trust, professionalism)
- Primary hover: #4338CA
- Accent: Emerald green #10B981 (approved states, success)
- Warning: Amber #F59E0B (pending, revision states)
- Danger: Rose #F43F5E (rejected states)
- Background: #F8FAFC (very light gray-blue)
- Surface/Card: #FFFFFF
- Border: #E2E8F0
- Text primary: #0F172A
- Text secondary: #64748B
- Text muted: #94A3B8

## Typography
- Font: Inter (Google Fonts)
- Headings: 600–700 weight, tight tracking
- Body: 400–500 weight, comfortable line height (1.6)
- Labels/captions: 12–13px, uppercase tracking for status badges

## Layout
- Sidebar navigation (left, 240px wide) for agency users
- Top navigation bar for client users (simpler, focused on the review task)
- Content area with generous padding (24–32px)
- Card-based UI for projects and files
- Clean data tables for lists

## Components
- Status badges: pill-shaped with color coding (Pending=amber, Approved=green, Revision=orange, Rejected=rose)
- File cards: thumbnail preview + filename + status badge + reviewer avatar
- Comment pins: numbered circles placed on images/documents
- Review toolbar: fixed bottom bar in review view with Approve / Request Revision / Reject buttons
- Activity feed: timeline with avatar, action, timestamp
- Notification dropdown: clean list with unread dot

## Elevation & Depth
- Cards: subtle shadow (0 1px 3px rgba(0,0,0,0.08))
- Modals: medium shadow with backdrop blur overlay
- Dropdowns: 0 4px 16px rgba(0,0,0,0.12)
- No heavy gradients — flat with subtle shadows

## Spacing
- Base unit: 4px
- Standard padding: 16px, 24px, 32px
- Section gaps: 24px–40px

## States
- Hover: slight background tint + cursor pointer
- Active/selected: primary color border-left highlight
- Loading: skeleton screens (no spinner overlays)
- Empty states: centered illustration placeholder + CTA copy

## Responsiveness
- Desktop-first (1280px+ primary)
- Tablet support (768px+)
- Mobile: read-only review experience for clients