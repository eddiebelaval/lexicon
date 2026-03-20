/**
 * Production Management Type Definitions
 *
 * Types for the production scheduling, crew management, and cast tracking
 * domain. Stored in PostgreSQL (Supabase), not Neo4j.
 *
 * Cast members are linked via Neo4j entity IDs (cast_entity_id fields).
 */

// ============================================
// Production Types
// ============================================

export type ProductionStatus = 'pre_production' | 'active' | 'post_production' | 'wrapped';

export interface Production {
  id: string;
  universeId: string;
  name: string;
  season: string | null;
  status: ProductionStatus;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface CreateProductionInput {
  universeId: string;
  name: string;
  season?: string;
  status?: ProductionStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateProductionInput {
  name?: string;
  season?: string | null;
  status?: ProductionStatus;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

// ============================================
// Crew Types
// ============================================

export type CrewRole = 'staff' | 'ac' | 'producer' | 'fixer' | 'editor' | 'coordinator' | 'field_producer' | 'post_supervisor';

export interface CrewMember {
  id: string;
  productionId: string;
  name: string;
  role: CrewRole;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCrewMemberInput {
  productionId: string;
  name: string;
  role: CrewRole;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateCrewMemberInput {
  name?: string;
  role?: CrewRole;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive?: boolean;
}

// ============================================
// Scene Types
// ============================================

export type ProdSceneStatus = 'scheduled' | 'shot' | 'cancelled' | 'postponed' | 'self_shot';

export interface ProdScene {
  id: string;
  productionId: string;
  sceneNumber: string | null;
  title: string;
  description: string | null;
  castEntityIds: string[];
  scheduledDate: string | null;
  scheduledTime: string | null;
  location: string | null;
  locationDetails: string | null;
  status: ProdSceneStatus;
  equipmentNotes: string | null;
  isSelfShot: boolean;
  episodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProdSceneInput {
  productionId: string;
  sceneNumber?: string;
  episodeId?: string;
  title: string;
  description?: string;
  castEntityIds?: string[];
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  locationDetails?: string;
  status?: ProdSceneStatus;
  equipmentNotes?: string;
  isSelfShot?: boolean;
}

export interface UpdateProdSceneInput {
  sceneNumber?: string | null;
  title?: string;
  description?: string | null;
  castEntityIds?: string[];
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  location?: string | null;
  locationDetails?: string | null;
  status?: ProdSceneStatus;
  equipmentNotes?: string | null;
  isSelfShot?: boolean;
  episodeId?: string | null;
}

// ============================================
// Scene Assignment Types
// ============================================

export type AssignmentRole = 'ac' | 'producer' | 'fixer' | 'coordinator' | 'backup';
export type AssignmentStatus = 'assigned' | 'confirmed' | 'completed' | 'cancelled';

export interface SceneAssignment {
  id: string;
  sceneId: string;
  crewMemberId: string;
  role: AssignmentRole;
  notes: string | null;
  status: AssignmentStatus;
  createdAt: Date;
}

export interface CreateSceneAssignmentInput {
  sceneId: string;
  crewMemberId: string;
  role?: AssignmentRole;
  notes?: string;
}

export interface UpdateSceneAssignmentInput {
  role?: AssignmentRole;
  notes?: string;
  status?: AssignmentStatus;
}

// ============================================
// Cast Contract Types
// ============================================

export type ContractStatus = 'signed' | 'pending' | 'offer_sent' | 'dnc' | 'email_sent' | 'declined';
export type PaymentType = 'daily' | 'flat';

export interface CastContract {
  id: string;
  productionId: string;
  castEntityId: string;
  castName: string | null;
  contractStatus: ContractStatus;
  paymentType: PaymentType | null;
  dailyRate: number | null;
  flatFee: number | null;
  totalPayment: number | null;
  paidAmount: number | null;
  paidDate: Date | null;
  shootDone: boolean;
  interviewDone: boolean;
  pickupDone: boolean;
  paymentDone: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCastContractInput {
  productionId: string;
  castEntityId: string;
  castName?: string;
  contractStatus?: ContractStatus;
  paymentType?: PaymentType;
  dailyRate?: number;
  flatFee?: number;
  totalPayment?: number;
  notes?: string;
}

export interface UpdateCastContractInput {
  castName?: string | null;
  contractStatus?: ContractStatus;
  paymentType?: PaymentType | null;
  dailyRate?: number | null;
  flatFee?: number | null;
  totalPayment?: number | null;
  paidAmount?: number | null;
  paidDate?: Date | null;
  shootDone?: boolean;
  interviewDone?: boolean;
  pickupDone?: boolean;
  paymentDone?: boolean;
  notes?: string | null;
}

// ============================================
// Crew Availability Types
// ============================================

export type AvailabilityStatus = 'available' | 'ooo' | 'dark' | 'holding' | 'booked';

export interface CrewAvailability {
  id: string;
  crewMemberId: string;
  date: string;
  status: AvailabilityStatus;
  notes: string | null;
}

export interface CreateCrewAvailabilityInput {
  crewMemberId: string;
  date: string;
  status?: AvailabilityStatus;
  notes?: string;
}

export interface UpdateCrewAvailabilityInput {
  status?: AvailabilityStatus;
  notes?: string | null;
}

// ============================================
// Episode Types
// ============================================

export type EpisodeStatus = 'planned' | 'in_production' | 'in_post' | 'delivered' | 'aired';

export interface Episode {
  id: string;
  productionId: string;
  episodeNumber: number;
  title: string | null;
  description: string | null;
  airDate: string | null;
  premiereDate: string | null;
  status: EpisodeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEpisodeInput {
  productionId: string;
  episodeNumber: number;
  title?: string;
  description?: string;
  airDate?: string;
  premiereDate?: string;
  status?: EpisodeStatus;
}

export interface UpdateEpisodeInput {
  episodeNumber?: number;
  title?: string | null;
  description?: string | null;
  airDate?: string | null;
  premiereDate?: string | null;
  status?: EpisodeStatus;
}

// ============================================
// Upload Task Types
// ============================================

export type UploadStatus = 'pending' | 'in_progress' | 'complete' | 'cancelled';

export interface UploadTask {
  id: string;
  sceneId: string;
  crewMemberId: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: UploadStatus;
  notes: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateUploadTaskInput {
  sceneId: string;
  crewMemberId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
}

export interface UpdateUploadTaskInput {
  crewMemberId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: UploadStatus;
  notes?: string;
}

// ============================================
// Composite Types (for UI display)
// ============================================

export interface SceneWithAssignments extends ProdScene {
  assignments: (SceneAssignment & { crewMember: CrewMember })[];
}

export interface CastContractWithEntity extends CastContract {
  castName: string;
  castType: string;
}

export interface ProductionSummary {
  production: Production;
  totalCast: number;
  signedCast: number;
  totalScenes: number;
  scenesShot: number;
  totalCrew: number;
  upcomingScenes: ProdScene[];
  incompleteContracts: CastContract[];
}
