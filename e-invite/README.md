# E-Invite - Wedding Invitation System

A beautiful, AI-powered wedding invitation management system. Create stunning animated digital wedding invitations with personalized guest links, photo galleries, music, RSVP tracking, and more.

## Features

### Admin Dashboard
- **Invitation Letters** - Create and manage wedding invitations with unique URLs (`domain.com/your-wedding-name`)
- **AI Designer** - AI-powered page designer using Google Gemini to customize every aspect of the invitation
- **Users Management** - Admin and Client roles with invitation assignment
- **Special Invitee Links** - Generate encrypted personalized links for each guest
- **Messages/Blessings** - View and manage guest wishes
- **Settings** - Brand customization, Gemini AI integration with test connection

### Public Invitation Pages
- Animated digital envelope opening experience
- Personalized greetings (special invitee vs. general guest)
- Wedding details with countdown timer
- Photo gallery with lightbox
- Background music player (looping .mp3) with animated rotating icon
- RSVP form
- Guest blessing/message wall
- Fully mobile responsive
- Customizable fonts, colors, and CSS

### AI Designer
- Chat-based interface to describe design changes
- Real-time preview with phone/tablet/desktop modes
- Color pickers, font selectors, section toggles
- Gallery photo management with drag-and-drop upload
- Music file upload and management
- Custom CSS editor
- Publish/unpublish control

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.x | Full-stack framework |
| TypeScript | 5.9.x | Type safety |
| React | 19.x | UI library |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Prisma | 7.x | Database ORM |
| MySQL | 8.x+ | Database |
| NextAuth.js | 5.x | Authentication |
| Google Gemini | 3.1 Flash Lite | AI design generation |
| Sharp | 0.34.x | Image processing |

## Quick Start

### Prerequisites
- Node.js 24.x LTS
- MySQL 8.x+
- npm

### Installation

1. **Clone and install dependencies**
```bash
cd e-invite
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

3. **Setup database**
```bash
# Create MySQL database
mysql -e "CREATE DATABASE einvite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Push schema
npm run db:push

# Seed default data
npm run db:seed
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

### Default Login
- **Email**: admin@einvite.com
- **Password**: admin123

> **Important**: Change the admin password after first login!

## VPS Deployment

For deploying on a fresh Ubuntu/Debian VPS:

```bash
chmod +x install.sh
sudo ./install.sh
```

The install script will:
1. Update system packages
2. Install Node.js LTS, MySQL, Nginx, PM2
3. Create database and user
4. Configure environment variables
5. Install dependencies and build
6. Setup Nginx reverse proxy
7. Start the app with PM2
8. Configure firewall

After installation:
- App accessible at `http://YOUR_SERVER_IP`
- For SSL: `sudo certbot --nginx -d yourdomain.com`

## Configuration

### Gemini AI Setup
1. Go to Dashboard > Settings
2. Enter your Google Gemini API key
3. Default model: `gemini-3.1-flash-lite-preview` (changeable)
4. Click "Test Connection" to verify
5. Save settings

### Creating an Invitation
1. Go to Dashboard > Invitation Letters > Create New
2. Fill in wedding details (title, slug, groom/bride names, date, venue)
3. Upload photos (groom, bride, couple)
4. Save the invitation
5. Go to Designer to customize the look
6. Publish when ready

### Adding Special Invitees
1. Go to an invitation's Invitees page
2. Add invitee name
3. System generates encrypted special link
4. Share the link: `domain.com/slug?special=encrypted_code`
5. Invitee sees personalized greeting: "Dear [Name]"

### Customizing Design
1. Go to Designer > click Design on an invitation
2. Use AI Chat: describe what you want ("make it more elegant", "add floral theme")
3. Or manually adjust: fonts, colors, sections, media
4. Preview in phone/tablet/desktop mode
5. Save and Publish

### Photo Upload & Optimization
- Supports JPG, PNG, WebP up to 5MB
- Images exceeding 2000x2000px or 2MB are automatically resized and compressed
- AI feedback is shown when photos are optimized, guiding users to ideal sizes
- Use the AI Designer to request further image style adjustments

## Packaging for Distribution

Create a distributable ZIP archive:

```bash
chmod +x package.sh
./package.sh
```

Output: `e-invite-v{version}-{timestamp}.zip` in the parent directory. Deploy by unzipping on a VPS and running `install.sh`.

## Project Structure

```
e-invite/
├── prisma/           # Database schema & seed
├── public/uploads/   # Uploaded files (photos, music)
├── src/
│   ├── app/          # Next.js App Router pages & API
│   ├── components/   # React components
│   ├── lib/          # Utilities (auth, prisma, encryption, gemini)
│   └── types/        # TypeScript type definitions
├── install.sh        # VPS installation script
├── package.sh        # ZIP packaging script
└── package.json      # Dependencies
```

See [CLAUDE.md](./CLAUDE.md) for detailed developer documentation.

## License

Private - All rights reserved.

---

Made with love for beautiful weddings.
