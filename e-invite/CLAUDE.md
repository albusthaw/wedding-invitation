# E-Invite - Wedding Invitation System

## Project Overview
E-Invite is a full-stack wedding invitation management system built with Next.js. It allows administrators to create, design, and manage beautiful animated wedding invitation pages with AI-powered design capabilities.

## Tech Stack
- **Framework**: Next.js 16.x (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5.9.x
- **UI**: React 19.x + Tailwind CSS 4.x
- **Animations**: Framer Motion 12.x
- **Database**: MySQL via Prisma ORM 7.x
- **Auth**: NextAuth.js v5 (Auth.js) with JWT strategy
- **AI**: Google Gemini API (`@google/genai`) - default model: `gemini-3.1-flash-lite-preview`
- **Image Processing**: Sharp 0.34.x
- **Audio**: Native HTML5 Audio API
- **Runtime**: Node.js 24.x LTS

## Project Structure
```
e-invite/
├── prisma/
│   ├── schema.prisma          # Database schema (MySQL)
│   └── seed.ts                # Database seeding script
├── public/
│   └── uploads/
│       ├── photos/            # Uploaded wedding photos
│       └── music/             # Uploaded .mp3 files
├── src/
│   ├── app/
│   │   ├── [slug]/            # Public invitation pages (dynamic)
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── designer/      # AI designer endpoints
│   │   │   ├── invitations/   # Invitation CRUD
│   │   │   ├── messages/      # Public messages endpoint
│   │   │   ├── rsvp/          # Public RSVP endpoint
│   │   │   ├── settings/      # Settings + Gemini test
│   │   │   ├── upload/        # File upload endpoint
│   │   │   └── users/         # User CRUD
│   │   ├── actions/           # Server actions
│   │   │   ├── designer.ts    # AI design generation
│   │   │   ├── invitation.ts  # Invitation CRUD actions
│   │   │   ├── invitee.ts     # Invitee management
│   │   │   ├── message.ts     # Message actions
│   │   │   ├── settings.ts    # Settings actions
│   │   │   └── user.ts        # User CRUD actions
│   │   ├── dashboard/         # Admin dashboard pages
│   │   │   ├── designer/      # AI Designer page
│   │   │   ├── invitations/   # Invitation management
│   │   │   ├── messages/      # Messages management
│   │   │   ├── settings/      # Settings page
│   │   │   └── users/         # User management
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── designer/          # Designer modal components
│   │   │   ├── AIChatPanel.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── DesignerModal.tsx
│   │   │   ├── FontSelector.tsx
│   │   │   ├── MediaUploader.tsx
│   │   │   └── PreviewPopup.tsx
│   │   ├── invitation/        # Public invitation components
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── EnvelopeOpener.tsx
│   │   │   ├── InvitationPage.tsx
│   │   │   ├── MessageWall.tsx
│   │   │   ├── MusicPlayer.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── RsvpForm.tsx
│   │   │   └── WeddingDetails.tsx
│   │   ├── SessionProvider.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── encryption.ts      # AES encryption for special links
│   │   ├── gemini.ts          # Gemini AI client utility
│   │   └── prisma.ts          # Prisma client singleton
│   ├── types/
│   │   ├── index.ts           # App TypeScript types
│   │   └── next-auth.d.ts     # NextAuth type augmentation
│   ├── auth.ts                # Auth re-exports
│   └── middleware.ts          # Route protection middleware
├── .env                       # Environment variables
├── .env.example               # Environment template
├── install.sh                 # VPS installation script
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
├── postcss.config.mjs         # PostCSS config
└── tsconfig.json              # TypeScript config
```

## Key Concepts

### Invitation Flow
1. Admin creates an InvitationLetter with slug, groom/bride names, date, venue
2. Admin assigns Users (clients) who can manage invitees for that invitation
3. Clients add invitees, generating encrypted special links
4. Admin designs the page using the AI Designer
5. Admin publishes the invitation
6. Public accesses `domain.com/{slug}` or `domain.com/{slug}?special={code}`

### Special Invitee Links
- Encrypted using AES-256-CBC with NEXTAUTH_SECRET as key
- Format: `name::invitationId` encrypted to URL-safe base64
- Decrypted on the public page to show personalized greeting

### Design Config
The `designConfig` JSON field on InvitationLetter stores:
```json
{
  "primaryFont": "Great Vibes",
  "backgroundColor": "#0d0505",
  "primaryColor": "#ed5566",
  "accentColor": "#c9a96e",
  "textColor": "#ffffff",
  "backgroundImage": "",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": ""
}
```

### Publish/Unpublish
- Invitation must be published to be publicly visible
- Design changes after publishing set `needsRepublish = true`
- Republishing from either Invitations page or Designer resets the flag

## Development Commands
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Seed default data
npx prisma studio    # Open Prisma Studio GUI
```

## Default Admin Credentials
- Email: `admin@einvite.com`
- Password: `admin123`
- **Change these after first login!**

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql://root:password@localhost:3306/einvite |
| NEXTAUTH_SECRET | JWT signing secret | (generate random) |
| NEXTAUTH_URL | App base URL | http://localhost:3000 |
| GEMINI_API_KEY | Google Gemini API key | (empty) |
| GEMINI_MODEL | Gemini model name | gemini-3.1-flash-lite-preview |

## Notes for AI Assistants
- This uses Next.js App Router (not Pages Router)
- Server Components are default; use "use client" only for interactive components
- Server Actions are in `src/app/actions/`
- API routes are in `src/app/api/`
- Prisma client is a singleton in `src/lib/prisma.ts`
- Auth is configured in `src/lib/auth.ts`; middleware in `src/middleware.ts`
- The public invitation page is at `src/app/[slug]/`
- All file uploads go to `public/uploads/`
