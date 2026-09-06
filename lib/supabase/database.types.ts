/**
 * Database types, mirroring supabase/migrations/0001_core.sql and
 * 0002_recommendations.sql.
 *
 * Hand-written rather than generated: `supabase gen types` runs through the
 * management API, which is currently refusing requests for this org. Keep
 * this file in step with the migrations by hand until that's restored, then
 * regenerate and delete this note.
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "converted"
  | "not_interested"
  | "lost";

export type InteractionChannel =
  | "phone"
  | "whatsapp"
  | "email"
  | "sms"
  | "in_person"
  | "other";

export type InteractionOutcome =
  | "interested"
  | "not_interested"
  | "call_back"
  | "info_requested"
  | "payment_discussion"
  | "assessment_discussion"
  | "converted"
  | "no_response"
  | "other";

export type AssessmentStatus = "in_progress" | "complete";
export type PaymentStatus = "created" | "paid" | "failed" | "cancelled";
/** Updated in 0002: added admin, manager; removed content_editor. */
export type AdminRole = "super_admin" | "admin" | "manager" | "sales";
export type ChildGender = "girl" | "boy" | "other";
export type MilestoneVideoDomain =
  | "vision" | "auditory" | "tactile" | "mobility" | "language" | "hand";


export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: { id: string; email: string; role: AdminRole; created_at: string };
        Insert: { id: string; email: string; role?: AdminRole; created_at?: string };
        Update: { email?: string; role?: AdminRole };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string;
          email?: string;
        };
        Update: { full_name?: string; phone?: string; email?: string };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          profile_id: string;
          status: LeadStatus;
          source: string;
          assigned_to: string | null;
          next_follow_up_at: string | null;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          status?: LeadStatus;
          source?: string;
          assigned_to?: string | null;
        };
        Update: {
          status?: LeadStatus;
          assigned_to?: string | null;
          next_follow_up_at?: string | null;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          dob: string;
          gender: ChildGender;
          gestational_weeks: number | null;
          city: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          name: string;
          dob: string;
          gender?: ChildGender;
          gestational_weeks?: number | null;
          city?: string | null;
          photo_url?: string | null;
        };
        Update: {
          name?: string;
          dob?: string;
          gender?: ChildGender;
          gestational_weeks?: number | null;
          city?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          child_id: string;
          assessed_on: string;
          start_stage: string;
          stages_by_domain: Record<string, string[]>;
          details: Record<string, string>;
          status: AssessmentStatus;
          bank_version: string;
          share_token: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          child_id: string;
          assessed_on?: string;
          start_stage: string;
          stages_by_domain?: Record<string, string[]>;
          details?: Record<string, string>;
          status?: AssessmentStatus;
          bank_version?: string;
        };
        Update: {
          stages_by_domain?: Record<string, string[]>;
          details?: Record<string, string>;
          status?: AssessmentStatus;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          assessment_id: string;
          item_id: string;
          value: number;
          answered_at: string;
        };
        Insert: {
          assessment_id: string;
          item_id: string;
          value: number;
        };
        Update: { value?: number };
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          lead_id: string;
          occurred_at: string;
          channel: InteractionChannel;
          outcome: InteractionOutcome;
          remarks: string;
          next_follow_up_at: string | null;
          logged_by: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          occurred_at?: string;
          channel?: InteractionChannel;
          outcome: InteractionOutcome;
          remarks?: string;
          next_follow_up_at?: string | null;
          logged_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          profile_id: string;
          child_id: string | null;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount_paise: number;
          currency: string;
          status: PaymentStatus;
          notes: Record<string, unknown>;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          profile_id: string;
          child_id?: string | null;
          razorpay_order_id: string;
          amount_paise: number;
          currency?: string;
          status?: PaymentStatus;
          notes?: Record<string, unknown>;
        };
        Update: {
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          status?: PaymentStatus;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      milestone_videos: {
        Row: {
          id: string;
          stage_id: string;
          domain: MilestoneVideoDomain;
          title: string;
          description: string;
          thumbnail_url: string;
          redirect_url: string;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          stage_id: string;
          domain: MilestoneVideoDomain;
          title: string;
          description?: string;
          thumbnail_url?: string;
          redirect_url: string;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          stage_id?: string;
          domain?: MilestoneVideoDomain;
          title?: string;
          description?: string;
          thumbnail_url?: string;
          redirect_url?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      course_recommendations: {
        Row: {
          id: string;
          stage_id: string;
          title: string;
          subtitle: string;
          description: string;
          thumbnail_url: string;
          redirect_url: string;
          age_label: string;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          stage_id: string;
          title: string;
          subtitle?: string;
          description?: string;
          thumbnail_url?: string;
          redirect_url: string;
          age_label?: string;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          stage_id?: string;
          title?: string;
          subtitle?: string;
          description?: string;
          thumbnail_url?: string;
          redirect_url?: string;
          age_label?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      admin_pages: {
        Row: {
          id: string;
          label: string;
          description: string;
          sort_order: number;
        };
        Insert: {
          id: string;
          label: string;
          description?: string;
          sort_order?: number;
        };
        Update: {
          label?: string;
          description?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      admin_page_access: {
        Row: {
          admin_user_id: string;
          page_id: string;
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          admin_user_id: string;
          page_id: string;
          granted_by?: string | null;
        };
        Update: {
          granted_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
      has_page_access: { Args: { page: string }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
