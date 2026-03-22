import type {
  User,
  InvitationLetter,
  Invitee,
  Message,
  UserInvitation,
  Setting,
  Role,
  RsvpStatus,
} from "@prisma/client";

// Re-export Prisma types
export type { User, InvitationLetter, Invitee, Message, UserInvitation, Setting };
export type { Role, RsvpStatus };

// User without password
export type SafeUser = Omit<User, "password">;

// Invitation with relations
export interface InvitationWithRelations extends InvitationLetter {
  users: (UserInvitation & { user: SafeUser })[];
  invitees: Invitee[];
  messages: MessageWithUser[];
}

// Message with optional user
export interface MessageWithUser extends Message {
  user: SafeUser | null;
}

// Invitation summary for listing
export interface InvitationSummary {
  id: string;
  slug: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: Date;
  weddingVenue: string;
  published: boolean;
  needsRepublish: boolean;
  inviteeCount: number;
  rsvpAccepted: number;
  rsvpDeclined: number;
  rsvpPending: number;
  createdAt: Date;
  updatedAt: Date;
}

// Design configuration
export interface DesignConfig {
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  headerStyle?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  animationsEnabled?: boolean;
  musicAutoplay?: boolean;
  showCountdown?: boolean;
  showGallery?: boolean;
  showMessages?: boolean;
  showRsvp?: boolean;
  showMap?: boolean;
  customSections?: CustomSection[];
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
  visible: boolean;
}

// RSVP form data
export interface RsvpFormData {
  specialCode: string;
  rsvpStatus: RsvpStatus;
  rsvpMessage?: string;
  numberOfGuests: number;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Register form data
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Invitation form data
export interface InvitationFormData {
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  weddingAddress: string;
  groomPhoto?: string;
  bridePhoto?: string;
  couplePhoto?: string;
  galleryPhotos?: string[];
  musicFile?: string;
  designConfig?: DesignConfig;
  customCss?: string;
  customHtml?: string;
}

// Invitee form data
export interface InviteeFormData {
  name: string;
  numberOfGuests: number;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalInvitations: number;
  totalInvitees: number;
  totalAccepted: number;
  totalDeclined: number;
  totalPending: number;
  totalMessages: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "rsvp" | "message" | "invitation_created" | "invitation_published";
  description: string;
  timestamp: Date;
  invitationId?: string;
  invitationTitle?: string;
}

// Gemini AI types
export interface AiGenerateRequest {
  prompt: string;
  context?: string;
}

export interface AiGenerateResponse {
  content: string;
  tokensUsed?: number;
}
