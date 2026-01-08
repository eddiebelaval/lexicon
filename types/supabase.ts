export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          is_public: boolean
          metadata: Json
          project_id: string | null
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          is_public?: boolean
          metadata?: Json
          project_id?: string | null
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          project_id?: string | null
          tool?: Database["public"]["Enums"]["tool_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          app_name: string
          bundle_id: string | null
          category: string | null
          created_at: string
          duration_seconds: number
          ended_at: string
          id: string
          is_productive: boolean | null
          last_synced_at: string | null
          milo_id: string | null
          started_at: string
          state: string | null
          sync_source: string | null
          url: string | null
          user_id: string
          window_title: string | null
        }
        Insert: {
          app_name: string
          bundle_id?: string | null
          category?: string | null
          created_at?: string
          duration_seconds: number
          ended_at: string
          id?: string
          is_productive?: boolean | null
          last_synced_at?: string | null
          milo_id?: string | null
          started_at: string
          state?: string | null
          sync_source?: string | null
          url?: string | null
          user_id: string
          window_title?: string | null
        }
        Update: {
          app_name?: string
          bundle_id?: string | null
          category?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          is_productive?: boolean | null
          last_synced_at?: string | null
          milo_id?: string | null
          started_at?: string
          state?: string | null
          sync_source?: string | null
          url?: string | null
          user_id?: string
          window_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string | null
          generation_count: number
          id: string
          month_year: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generation_count?: number
          id?: string
          month_year: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generation_count?: number
          id?: string
          month_year?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_tools: Json
          created_at: string
          expires_at: string | null
          id: string
          is_revoked: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: Json
          usage_count: number
          user_id: string
        }
        Insert: {
          allowed_tools?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: Json
          usage_count?: number
          user_id: string
        }
        Update: {
          allowed_tools?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: Json
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_classifications: {
        Row: {
          app_name: string
          bundle_id: string | null
          created_at: string
          default_state: string | null
          id: string
          is_custom: boolean
          keywords: Json | null
          last_synced_at: string | null
          milo_id: string | null
          sync_source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_name: string
          bundle_id?: string | null
          created_at?: string
          default_state?: string | null
          id?: string
          is_custom?: boolean
          keywords?: Json | null
          last_synced_at?: string | null
          milo_id?: string | null
          sync_source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_name?: string
          bundle_id?: string | null
          created_at?: string
          default_state?: string | null
          id?: string
          is_custom?: boolean
          keywords?: Json | null
          last_synced_at?: string | null
          milo_id?: string | null
          sync_source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_classifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_sessions: {
        Row: {
          ai_personality: string | null
          conversation: Json | null
          created_at: string | null
          current_phase: number | null
          format: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          last_activity: string | null
          phase_outputs: Json | null
          session_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_personality?: string | null
          conversation?: Json | null
          created_at?: string | null
          current_phase?: number | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          last_activity?: string | null
          phase_outputs?: Json | null
          session_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_personality?: string | null
          conversation?: Json | null
          created_at?: string | null
          current_phase?: number | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          last_activity?: string | null
          phase_outputs?: Json | null
          session_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beta_access: {
        Row: {
          access_tier: string
          granted_at: string
          id: string
          invite_code_id: string | null
          metadata: Json | null
          user_id: string
          waitlist_id: string | null
        }
        Insert: {
          access_tier?: string
          granted_at?: string
          id?: string
          invite_code_id?: string | null
          metadata?: Json | null
          user_id: string
          waitlist_id?: string | null
        }
        Update: {
          access_tier?: string
          granted_at?: string
          id?: string
          invite_code_id?: string | null
          metadata?: Json | null
          user_id?: string
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_access_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_access_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount_paid: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          relationships: Json | null
          role: string | null
          story_potential: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          relationships?: Json | null
          role?: string | null
          story_potential?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          relationships?: Json | null
          role?: string | null
          story_potential?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chart_layouts: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      claude_observations: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          id: string
          is_pinned: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_pinned?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_pinned?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      claude_stats: {
        Row: {
          agents_used: Json | null
          bugs_fixed: number | null
          builds_succeeded: number | null
          commits_together: number | null
          created_at: string | null
          first_commit_date: string | null
          hours_collaborated: number | null
          id: string
          languages: Json | null
          last_commit_date: string | null
          last_synced_at: string | null
          lines_added: number | null
          lines_of_code: number | null
          lines_removed: number | null
          mcp_used: Json | null
          milestones_hit: number | null
          projects_shipped: number | null
          sessions_count: number | null
          skills_used: Json | null
          tests_written: number | null
          tool_bash: number | null
          tool_edit: number | null
          tool_read: number | null
          tool_write: number | null
          updated_at: string | null
        }
        Insert: {
          agents_used?: Json | null
          bugs_fixed?: number | null
          builds_succeeded?: number | null
          commits_together?: number | null
          created_at?: string | null
          first_commit_date?: string | null
          hours_collaborated?: number | null
          id?: string
          languages?: Json | null
          last_commit_date?: string | null
          last_synced_at?: string | null
          lines_added?: number | null
          lines_of_code?: number | null
          lines_removed?: number | null
          mcp_used?: Json | null
          milestones_hit?: number | null
          projects_shipped?: number | null
          sessions_count?: number | null
          skills_used?: Json | null
          tests_written?: number | null
          tool_bash?: number | null
          tool_edit?: number | null
          tool_read?: number | null
          tool_write?: number | null
          updated_at?: string | null
        }
        Update: {
          agents_used?: Json | null
          bugs_fixed?: number | null
          builds_succeeded?: number | null
          commits_together?: number | null
          created_at?: string | null
          first_commit_date?: string | null
          hours_collaborated?: number | null
          id?: string
          languages?: Json | null
          last_commit_date?: string | null
          last_synced_at?: string | null
          lines_added?: number | null
          lines_of_code?: number | null
          lines_removed?: number | null
          mcp_used?: Json | null
          milestones_hit?: number | null
          projects_shipped?: number | null
          sessions_count?: number | null
          skills_used?: Json | null
          tests_written?: number | null
          tool_bash?: number | null
          tool_edit?: number | null
          tool_read?: number | null
          tool_write?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commands: {
        Row: {
          author: string | null
          category: string
          command: string
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          name: string
          prerequisites: string[] | null
          search_vector: unknown
          slug: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          verified: boolean | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          category: string
          command: string
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          name: string
          prerequisites?: string[] | null
          search_vector?: unknown
          slug: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          command?: string
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          name?: string
          prerequisites?: string[] | null
          search_vector?: unknown
          slug?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      content_queue: {
        Row: {
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          priority: number | null
          published_at: string | null
          retry_count: number | null
          scheduled_at: string | null
          slug: string
          social_platforms: string[] | null
          social_posted_at: string | null
          social_status: string | null
          source_path: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          priority?: number | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          slug: string
          social_platforms?: string[] | null
          social_posted_at?: string | null
          social_status?: string | null
          source_path?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          priority?: number | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          slug?: string
          social_platforms?: string[] | null
          social_posted_at?: string | null
          social_status?: string | null
          source_path?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          provider: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_slug: string
          created_at: string | null
          id: string
          module_slug: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_slug: string
          created_at?: string | null
          id?: string
          module_slug: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_slug?: string
          created_at?: string | null
          id?: string
          module_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      cross_references: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          reference_type: string
          source_entity_id: string
          source_entity_type: string
          source_tool: Database["public"]["Enums"]["tool_type"]
          target_entity_id: string
          target_entity_type: string
          target_tool: Database["public"]["Enums"]["tool_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          reference_type: string
          source_entity_id: string
          source_entity_type: string
          source_tool: Database["public"]["Enums"]["tool_type"]
          target_entity_id: string
          target_entity_type: string
          target_tool: Database["public"]["Enums"]["tool_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          reference_type?: string
          source_entity_id?: string
          source_entity_type?: string
          source_tool?: Database["public"]["Enums"]["tool_type"]
          target_entity_id?: string
          target_entity_type?: string
          target_tool?: Database["public"]["Enums"]["tool_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cross_references_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          adjacent_minutes: number
          created_at: string
          date: string
          id: string
          insights: string | null
          last_synced_at: string | null
          milo_id: string | null
          noise_minutes: number
          score: number
          signal_minutes: number
          streak_day: number
          sync_source: string | null
          tasks_completed: number
          tasks_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adjacent_minutes?: number
          created_at?: string
          date: string
          id?: string
          insights?: string | null
          last_synced_at?: string | null
          milo_id?: string | null
          noise_minutes?: number
          score?: number
          signal_minutes?: number
          streak_day?: number
          sync_source?: string | null
          tasks_completed?: number
          tasks_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adjacent_minutes?: number
          created_at?: string
          date?: string
          id?: string
          insights?: string | null
          last_synced_at?: string | null
          milo_id?: string | null
          noise_minutes?: number
          score?: number
          signal_minutes?: number
          streak_day?: number
          sync_source?: string | null
          tasks_completed?: number
          tasks_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          active_users: number | null
          codes_redeemed: number | null
          created_at: string | null
          date: string
          id: string
          new_signups: number | null
          stats_data: Json | null
          total_page_views: number | null
          unique_visitors: number | null
          updated_at: string | null
          waitlist_signups: number | null
        }
        Insert: {
          active_users?: number | null
          codes_redeemed?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_signups?: number | null
          stats_data?: Json | null
          total_page_views?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          waitlist_signups?: number | null
        }
        Update: {
          active_users?: number | null
          codes_redeemed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_signups?: number | null
          stats_data?: Json | null
          total_page_views?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          waitlist_signups?: number | null
        }
        Relationships: []
      }
      email_sequence_logs: {
        Row: {
          clicked_at: string | null
          email: string
          id: string
          opened_at: string | null
          resend_message_id: string | null
          sent_at: string
          sequence_id: string
          sequence_record_id: string | null
          status: string | null
          step: number
        }
        Insert: {
          clicked_at?: string | null
          email: string
          id?: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sequence_id: string
          sequence_record_id?: string | null
          status?: string | null
          step: number
        }
        Update: {
          clicked_at?: string | null
          email?: string
          id?: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sequence_id?: string
          sequence_record_id?: string | null
          status?: string | null
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_logs_sequence_record_id_fkey"
            columns: ["sequence_record_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          email: string
          id: string
          next_send_at: string | null
          sequence_id: string
          source: string | null
          started_at: string
          status: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          email: string
          id?: string
          next_send_at?: string | null
          sequence_id: string
          source?: string | null
          started_at?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          email?: string
          id?: string
          next_send_at?: string | null
          sequence_id?: string
          source?: string | null
          started_at?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          ended_at: string | null
          focus_score: number | null
          id: string
          interruption_count: number
          last_synced_at: string | null
          milo_id: string | null
          project_id: string | null
          session_type: string
          started_at: string
          sync_source: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          ended_at?: string | null
          focus_score?: number | null
          id?: string
          interruption_count?: number
          last_synced_at?: string | null
          milo_id?: string | null
          project_id?: string | null
          session_type?: string
          started_at: string
          sync_source?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          focus_score?: number | null
          id?: string
          interruption_count?: number
          last_synced_at?: string | null
          milo_id?: string | null
          project_id?: string | null
          session_type?: string
          started_at?: string
          sync_source?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          goal_type: string
          id: string
          is_completed: boolean
          last_synced_at: string | null
          milo_id: string | null
          parent_id: string | null
          project_id: string | null
          start_date: string | null
          sync_source: string | null
          target_date: string | null
          target_value: number | null
          timeframe: string | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          goal_type?: string
          id?: string
          is_completed?: boolean
          last_synced_at?: string | null
          milo_id?: string | null
          parent_id?: string | null
          project_id?: string | null
          start_date?: string | null
          sync_source?: string | null
          target_date?: string | null
          target_value?: number | null
          timeframe?: string | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          goal_type?: string
          id?: string
          is_completed?: boolean
          last_synced_at?: string | null
          milo_id?: string | null
          parent_id?: string | null
          project_id?: string | null
          start_date?: string | null
          sync_source?: string | null
          target_date?: string | null
          target_value?: number | null
          timeframe?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number
          metadata: Json | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          metadata?: Json | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          metadata?: Json | null
          uses_count?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string | null
          direction: string
          emotion_at_entry: string
          emotion_at_exit: string | null
          entry_price: number
          exit_price: number | null
          id: string
          lessons_learned: string | null
          notes: string | null
          pnl: number | null
          pnl_percent: number | null
          quantity: number
          screenshot_urls: Json | null
          symbol: string
          tags: string[] | null
          thesis_id: string | null
          trade_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          emotion_at_entry: string
          emotion_at_exit?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity: number
          screenshot_urls?: Json | null
          symbol: string
          tags?: string[] | null
          thesis_id?: string | null
          trade_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          emotion_at_entry?: string
          emotion_at_exit?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity?: number
          screenshot_urls?: Json | null
          symbol?: string
          tags?: string[] | null
          thesis_id?: string | null
          trade_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "thesis"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          created_at: string
          document_id: string | null
          file_content: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          metadata: Json | null
          scope: string | null
          storage_path: string | null
          tags: Json | null
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          file_content?: string | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          metadata?: Json | null
          scope?: string | null
          storage_path?: string | null
          tags?: Json | null
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          file_content?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          metadata?: Json | null
          scope?: string | null
          storage_path?: string | null
          tags?: Json | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          provider: string | null
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          provider?: string | null
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          provider?: string | null
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      milo_waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          clicked_at: string | null
          email: string
          id: string
          is_academy_version: boolean | null
          issue_number: number
          opened_at: string | null
          resend_message_id: string | null
          sent_at: string
          status: string | null
        }
        Insert: {
          clicked_at?: string | null
          email: string
          id?: string
          is_academy_version?: boolean | null
          issue_number: number
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string
          status?: string | null
        }
        Update: {
          clicked_at?: string | null
          email?: string
          id?: string
          is_academy_version?: boolean | null
          issue_number?: number
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string
          status?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_academy_member: boolean | null
          source: string | null
          status: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_academy_member?: boolean | null
          source?: string | null
          status?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_academy_member?: boolean | null
          source?: string | null
          status?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_status: {
        Row: {
          is_configured: boolean | null
          last_verified_at: string | null
          platform: string
          username: string | null
        }
        Insert: {
          is_configured?: boolean | null
          last_verified_at?: string | null
          platform: string
          username?: string | null
        }
        Update: {
          is_configured?: boolean | null
          last_verified_at?: string | null
          platform?: string
          username?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          platforms: string[]
          results: Json | null
          scheduled_for: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          platforms: string[]
          results?: Json | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          platforms?: string[]
          results?: Json | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          symbol: string
          target_value: number
          triggered: boolean | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          symbol: string
          target_value: number
          triggered?: boolean | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          symbol?: string
          target_value?: number
          triggered?: boolean | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          overage_enabled: boolean | null
          overage_limit_cents: number | null
          overage_spent_cents: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          overage_enabled?: boolean | null
          overage_limit_cents?: number | null
          overage_spent_cents?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          overage_enabled?: boolean | null
          overage_limit_cents?: number | null
          overage_spent_cents?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          accepted_at: string | null
          can_delete: boolean
          can_manage: boolean
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          can_delete?: boolean
          can_manage?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          can_delete?: boolean
          can_manage?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          content_count: number
          created_at: string
          deleted_at: string | null
          description: string | null
          entity_count: number
          id: string
          is_archived: boolean
          is_campaign: boolean
          is_public: boolean
          is_research: boolean
          is_universe: boolean
          name: string
          owner_id: string
          research_count: number
          settings: Json
          slug: string
          task_count: number
          updated_at: string
        }
        Insert: {
          content_count?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_count?: number
          id?: string
          is_archived?: boolean
          is_campaign?: boolean
          is_public?: boolean
          is_research?: boolean
          is_universe?: boolean
          name: string
          owner_id: string
          research_count?: number
          settings?: Json
          slug: string
          task_count?: number
          updated_at?: string
        }
        Update: {
          content_count?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_count?: number
          id?: string
          is_archived?: boolean
          is_campaign?: boolean
          is_public?: boolean
          is_research?: boolean
          is_universe?: boolean
          name?: string
          owner_id?: string
          research_count?: number
          settings?: Json
          slug?: string
          task_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_windows: {
        Row: {
          created_at: string
          day_of_week: number
          end_hour: number
          id: string
          is_active: boolean | null
          start_hour: number
          timezone: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_hour: number
          id?: string
          is_active?: boolean | null
          start_hour: number
          timezone?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_hour?: number
          id?: string
          is_active?: boolean | null
          start_hour?: number
          timezone?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          github_invite_sent: boolean | null
          github_invite_sent_at: string | null
          github_username: string | null
          id: string
          product_id: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          github_invite_sent?: boolean | null
          github_invite_sent_at?: string | null
          github_username?: string | null
          id?: string
          product_id: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          github_invite_sent?: boolean | null
          github_invite_sent_at?: string | null
          github_username?: string | null
          id?: string
          product_id?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          author: string | null
          category: string
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          max_tokens: number | null
          model: string | null
          name: string
          search_vector: unknown
          settings: Json
          slug: string
          status: string | null
          tags: string[] | null
          temperature: number | null
          updated_at: string | null
          use_case: string | null
          verified: boolean | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          category: string
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          max_tokens?: number | null
          model?: string | null
          name: string
          search_vector?: unknown
          settings: Json
          slug: string
          status?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          use_case?: string | null
          verified?: boolean | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          max_tokens?: number | null
          model?: string | null
          name?: string
          search_vector?: unknown
          settings?: Json
          slug?: string
          status?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          use_case?: string | null
          verified?: boolean | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      skill_collection_items: {
        Row: {
          added_at: string | null
          collection_id: string | null
          display_order: number | null
          id: string
          note: string | null
          skill_id: string | null
        }
        Insert: {
          added_at?: string | null
          collection_id?: string | null
          display_order?: number | null
          id?: string
          note?: string | null
          skill_id?: string | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string | null
          display_order?: number | null
          id?: string
          note?: string | null
          skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "skill_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_collection_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_collections: {
        Row: {
          author: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_official: boolean | null
          is_public: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_installs: {
        Row: {
          id: string
          installed_at: string | null
          method: string | null
          platform: string | null
          session_id: string | null
          skill_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          installed_at?: string | null
          method?: string | null
          platform?: string | null
          session_id?: string | null
          skill_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          installed_at?: string | null
          method?: string | null
          platform?: string | null
          session_id?: string | null
          skill_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_installs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_reviews: {
        Row: {
          body: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          skill_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          skill_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          skill_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_reviews_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_views: {
        Row: {
          id: string
          referrer: string | null
          session_id: string | null
          skill_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          referrer?: string | null
          session_id?: string | null
          skill_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          referrer?: string | null
          session_id?: string | null
          skill_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_views_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          author: string | null
          avg_rating: number | null
          category_id: string | null
          commands: string[] | null
          complexity: string | null
          content: string | null
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          name: string
          published_at: string | null
          quality_score: number | null
          quality_tier: string | null
          readme: string | null
          repo_path: string | null
          repo_url: string | null
          review_count: number | null
          search_vector: unknown
          slug: string
          status: string | null
          tags: string[] | null
          triggers: string[] | null
          updated_at: string | null
          validated: boolean | null
          verified: boolean | null
          version: string
          view_count: number | null
        }
        Insert: {
          author?: string | null
          avg_rating?: number | null
          category_id?: string | null
          commands?: string[] | null
          complexity?: string | null
          content?: string | null
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          name: string
          published_at?: string | null
          quality_score?: number | null
          quality_tier?: string | null
          readme?: string | null
          repo_path?: string | null
          repo_url?: string | null
          review_count?: number | null
          search_vector?: unknown
          slug: string
          status?: string | null
          tags?: string[] | null
          triggers?: string[] | null
          updated_at?: string | null
          validated?: boolean | null
          verified?: boolean | null
          version?: string
          view_count?: number | null
        }
        Update: {
          author?: string | null
          avg_rating?: number | null
          category_id?: string | null
          commands?: string[] | null
          complexity?: string | null
          content?: string | null
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          install_count?: number | null
          license?: string | null
          name?: string
          published_at?: string | null
          quality_score?: number | null
          quality_tier?: string | null
          readme?: string | null
          repo_path?: string | null
          repo_url?: string | null
          review_count?: number | null
          search_vector?: unknown
          slug?: string
          status?: string | null
          tags?: string[] | null
          triggers?: string[] | null
          updated_at?: string | null
          validated?: boolean | null
          verified?: boolean | null
          version?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_spacing_config: {
        Row: {
          created_at: string
          id: string
          max_gap_hours: number | null
          max_posts_per_day: number | null
          min_gap_hours: number | null
          timezone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_gap_hours?: number | null
          max_posts_per_day?: number | null
          min_gap_hours?: number | null
          timezone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_gap_hours?: number | null
          max_posts_per_day?: number | null
          min_gap_hours?: number | null
          timezone?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          active?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          active?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          operation: string
          payload: Json
          processed_at: string | null
          record_id: string
          retry_count: number
          status: string
          table_name: string
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation: string
          payload: Json
          processed_at?: string | null
          record_id: string
          retry_count?: number
          status?: string
          table_name: string
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation?: string
          payload?: Json
          processed_at?: string | null
          record_id?: string
          retry_count?: number
          status?: string
          table_name?: string
          tool?: Database["public"]["Enums"]["tool_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      taggings: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          taggable_id?: string
          taggable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          category_id: string | null
          category_name: string | null
          completed_at: string | null
          context_app: string | null
          context_url: string | null
          created_at: string
          days_worked: number | null
          description: string | null
          due_date: string | null
          end_date: string | null
          estimated_days: number | null
          estimated_minutes: number | null
          goal_id: string | null
          id: string
          is_recurring: boolean
          last_synced_at: string | null
          last_worked_date: string | null
          milo_id: string | null
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          recurrence_pattern: string | null
          reminder_at: string | null
          scheduled_date: string | null
          sort_order: number
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          sync_source: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          category_id?: string | null
          category_name?: string | null
          completed_at?: string | null
          context_app?: string | null
          context_url?: string | null
          created_at?: string
          days_worked?: number | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_days?: number | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_recurring?: boolean
          last_synced_at?: string | null
          last_worked_date?: string | null
          milo_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_pattern?: string | null
          reminder_at?: string | null
          scheduled_date?: string | null
          sort_order?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          sync_source?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          category_id?: string | null
          category_name?: string | null
          completed_at?: string | null
          context_app?: string | null
          context_url?: string | null
          created_at?: string
          days_worked?: number | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_days?: number | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          is_recurring?: boolean
          last_synced_at?: string | null
          last_worked_date?: string | null
          milo_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_pattern?: string | null
          reminder_at?: string | null
          scheduled_date?: string | null
          sort_order?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          sync_source?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          entry_target: number | null
          exit_target: number | null
          hypothesis: string
          id: string
          key_conditions: Json | null
          risk_reward_ratio: number | null
          status: string
          stop_loss: number | null
          symbol: string
          timeframe: string | null
          title: string
          updated_at: string | null
          user_id: string
          validation_notes: string | null
          validation_score: number | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          entry_target?: number | null
          exit_target?: number | null
          hypothesis: string
          id?: string
          key_conditions?: Json | null
          risk_reward_ratio?: number | null
          status?: string
          stop_loss?: number | null
          symbol: string
          timeframe?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          validation_notes?: string | null
          validation_score?: number | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          entry_target?: number | null
          exit_target?: number | null
          hypothesis?: string
          id?: string
          key_conditions?: Json | null
          risk_reward_ratio?: number | null
          status?: string
          stop_loss?: number | null
          symbol?: string
          timeframe?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          validation_notes?: string | null
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "thesis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      token_quotas: {
        Row: {
          created_at: string | null
          id: string
          period_type: string
          tier: string
          token_limit: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_type: string
          tier: string
          token_limit: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          period_type?: string
          tier?: string
          token_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          created_at: string | null
          id: string
          is_overage: boolean | null
          metadata: Json | null
          service: string
          tokens_consumed: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_overage?: boolean | null
          metadata?: Json | null
          service: string
          tokens_consumed: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_overage?: boolean | null
          metadata?: Json | null
          service?: string
          tokens_consumed?: number
          user_id?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          created_at: string | null
          id: string
          period_start: string
          period_type: string
          tokens_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_start: string
          period_type: string
          tokens_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          period_start?: string
          period_type?: string
          tokens_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tour_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_step_ids: string[] | null
          current_step_index: number
          id: string
          skipped: boolean
          started_at: string
          tour_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_step_ids?: string[] | null
          current_step_index?: number
          id?: string
          skipped?: boolean
          started_at?: string
          tour_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_step_ids?: string[] | null
          current_step_index?: number
          id?: string
          skipped?: boolean
          started_at?: string
          tour_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          action: string
          created_at: string | null
          id: string
          notes: string | null
          order_type: string
          pnl: number | null
          price: number
          quantity: number
          symbol: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_type: string
          pnl?: number | null
          price: number
          quantity: number
          symbol: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_type?: string
          pnl?: number | null
          price?: number
          quantity?: number
          symbol?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      universes: {
        Row: {
          created_at: string | null
          description: string | null
          entity_count: number | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string
          relationship_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_count?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id: string
          relationship_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_count?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string
          relationship_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_generations_used: number | null
          compositions_created: number | null
          created_at: string | null
          exports_generated: number | null
          id: string
          knowledge_entries: number | null
          period_end: string
          period_start: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generations_used?: number | null
          compositions_created?: number | null
          created_at?: string | null
          exports_generated?: number | null
          id?: string
          knowledge_entries?: number | null
          period_end: string
          period_start: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generations_used?: number | null
          compositions_created?: number | null
          created_at?: string | null
          exports_generated?: number | null
          id?: string
          knowledge_entries?: number | null
          period_end?: string
          period_start?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          ai_model: string | null
          created_at: string | null
          creativity: number | null
          custom_personalities: Json | null
          default_personality_id: string | null
          id: string
          temperature: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          creativity?: number | null
          custom_personalities?: Json | null
          default_personality_id?: string | null
          id?: string
          temperature?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          creativity?: number | null
          custom_personalities?: Json | null
          default_personality_id?: string | null
          id?: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          default_provider: string | null
          default_risk_pct: number | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_provider?: string | null
          default_risk_pct?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_provider?: string | null
          default_risk_pct?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          beta_features_enabled: boolean
          bio: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          email: string
          id: string
          last_active_at: string | null
          monthly_ai_tokens_limit: number
          monthly_ai_tokens_used: number
          monthly_storage_limit_mb: number
          monthly_storage_used_mb: number
          preferences: Json
          subscription_expires_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          beta_features_enabled?: boolean
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          email: string
          id: string
          last_active_at?: string | null
          monthly_ai_tokens_limit?: number
          monthly_ai_tokens_used?: number
          monthly_storage_limit_mb?: number
          monthly_storage_used_mb?: number
          preferences?: Json
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          beta_features_enabled?: boolean
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email?: string
          id?: string
          last_active_at?: string | null
          monthly_ai_tokens_limit?: number
          monthly_ai_tokens_used?: number
          monthly_storage_limit_mb?: number
          monthly_storage_used_mb?: number
          preferences?: Json
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      user_skill_stack_items: {
        Row: {
          added_at: string | null
          display_order: number | null
          id: string
          skill_id: string | null
          stack_id: string | null
        }
        Insert: {
          added_at?: string | null
          display_order?: number | null
          id?: string
          skill_id?: string | null
          stack_id?: string | null
        }
        Update: {
          added_at?: string | null
          display_order?: number | null
          id?: string
          skill_id?: string | null
          stack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_stack_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_stack_items_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "user_skill_stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_stacks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          share_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v1_document_versions: {
        Row: {
          change_summary: string | null
          confidence: number | null
          content: string
          content_html: string | null
          created_at: string
          document_id: string
          id: string
          label: string | null
          metadata: Json
          reasoning: string | null
          version: string
          version_type: string
        }
        Insert: {
          change_summary?: string | null
          confidence?: number | null
          content: string
          content_html?: string | null
          created_at?: string
          document_id: string
          id?: string
          label?: string | null
          metadata?: Json
          reasoning?: string | null
          version: string
          version_type: string
        }
        Update: {
          change_summary?: string | null
          confidence?: number | null
          content?: string
          content_html?: string | null
          created_at?: string
          document_id?: string
          id?: string
          label?: string | null
          metadata?: Json
          reasoning?: string | null
          version?: string
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "v1_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "v1_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      v1_documents: {
        Row: {
          content: string
          created_at: string | null
          document_type: Database["public"]["Enums"]["v1_document_type"]
          id: string
          is_autosave: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
          version: string
          version_metadata: Json
          word_count: number | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["v1_document_type"]
          id?: string
          is_autosave?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          version?: string
          version_metadata?: Json
          word_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["v1_document_type"]
          id?: string
          is_autosave?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          version?: string
          version_metadata?: Json
          word_count?: number | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          interests: string[] | null
          name: string | null
          referral_source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interests?: string[] | null
          name?: string | null
          referral_source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interests?: string[] | null
          name?: string | null
          referral_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist_submissions: {
        Row: {
          created_at: string
          id: string
          name: string | null
          notes: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
          symbols: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          symbols?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          symbols?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          events: Json
          failure_count: number
          id: string
          is_active: boolean
          last_status_code: number | null
          last_triggered_at: string | null
          name: string
          project_id: string | null
          secret: string
          success_count: number
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          name: string
          project_id?: string | null
          secret: string
          success_count?: number
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          name?: string
          project_id?: string | null
          secret?: string
          success_count?: number
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_custom_personality: {
        Args: { p_personality: Json; p_user_id: string }
        Returns: Json
      }
      archive_old_arc_sessions: { Args: never; Returns: undefined }
      check_quota: {
        Args: { p_tokens_needed?: number; p_user_id: string }
        Returns: Json
      }
      check_subscription_limits: {
        Args: {
          p_current_count?: number
          p_limit_type: string
          p_user_id: string
        }
        Returns: Json
      }
      find_next_publish_slot: { Args: never; Returns: string }
      get_active_arc_session: {
        Args: { p_user_id: string }
        Returns: {
          ai_personality: string | null
          conversation: Json | null
          created_at: string | null
          current_phase: number | null
          format: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          last_activity: string | null
          phase_outputs: Json | null
          session_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "arc_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_or_create_user_ai_preferences: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_period_start: { Args: { period_type: string }; Returns: string }
      get_quota_limit: {
        Args: { p_period_type: string; p_tier: string }
        Returns: number
      }
      get_token_usage: {
        Args: { p_period_type: string; p_user_id: string }
        Returns: number
      }
      get_trending_skills: {
        Args: { days_back?: number; limit_count?: number }
        Returns: {
          skill_id: string
          skill_name: string
          skill_slug: string
          view_count: number
        }[]
      }
      has_purchased: { Args: { p_product_id: string }; Returns: boolean }
      increment_ai_usage: {
        Args: { p_count?: number; p_user_id: string }
        Returns: undefined
      }
      record_token_usage: {
        Args: {
          p_metadata?: Json
          p_service: string
          p_tokens: number
          p_user_id: string
        }
        Returns: Json
      }
      redeem_invite_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      remove_custom_personality: {
        Args: { p_personality_id: string; p_user_id: string }
        Returns: Json
      }
      search_commands: {
        Args: { limit_count?: number; query_text: string }
        Returns: {
          author: string | null
          category: string
          command: string
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          name: string
          prerequisites: string[] | null
          search_vector: unknown
          slug: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          verified: boolean | null
          version: string | null
          view_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "commands"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_knowledge_files: {
        Args: {
          p_limit?: number
          p_scope?: string
          p_search_term?: string
          p_tags?: string[]
          p_user_id: string
        }
        Returns: {
          created_at: string
          document_id: string | null
          file_content: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          metadata: Json | null
          scope: string | null
          storage_path: string | null
          tags: Json | null
          updated_at: string
          user_id: string
          word_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "knowledge_files"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_settings: {
        Args: { limit_count?: number; query_text: string }
        Returns: {
          author: string | null
          category: string
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          max_tokens: number | null
          model: string | null
          name: string
          search_vector: unknown
          settings: Json
          slug: string
          status: string | null
          tags: string[] | null
          temperature: number | null
          updated_at: string | null
          use_case: string | null
          verified: boolean | null
          version: string | null
          view_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_skills: {
        Args: { limit_count?: number; query_text: string }
        Returns: {
          author: string | null
          avg_rating: number | null
          category_id: string | null
          commands: string[] | null
          complexity: string | null
          content: string | null
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          install_count: number | null
          license: string | null
          name: string
          published_at: string | null
          quality_score: number | null
          quality_tier: string | null
          readme: string | null
          repo_path: string | null
          repo_url: string | null
          review_count: number | null
          search_vector: unknown
          slug: string
          status: string | null
          tags: string[] | null
          triggers: string[] | null
          updated_at: string | null
          validated: boolean | null
          verified: boolean | null
          version: string
          view_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "skills"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      track_command_install: {
        Args: { p_command_id: string }
        Returns: undefined
      }
      track_setting_install: {
        Args: { p_setting_id: string }
        Returns: undefined
      }
      track_skill_install: {
        Args: {
          p_method?: string
          p_platform?: string
          p_session_id?: string
          p_skill_id: string
        }
        Returns: undefined
      }
      track_skill_view: {
        Args: { p_referrer?: string; p_session_id?: string; p_skill_id: string }
        Returns: undefined
      }
      update_daily_stats: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_type:
        | "create"
        | "update"
        | "delete"
        | "view"
        | "share"
        | "export"
        | "import"
        | "generate"
        | "research"
        | "sync"
      content_status:
        | "draft"
        | "in_review"
        | "approved"
        | "published"
        | "archived"
      content_type:
        | "article"
        | "blog_post"
        | "social_post"
        | "email"
        | "script"
        | "story"
        | "documentation"
        | "marketing_copy"
        | "custom"
      document_type:
        | "beat-sheet"
        | "script"
        | "notes"
        | "field-guide"
        | "interview-questions"
      entity_type:
        | "character"
        | "location"
        | "event"
        | "object"
        | "faction"
        | "concept"
        | "timeline"
      episode_status: "draft" | "review" | "final"
      project_type:
        | "couples-journey"
        | "tell-all"
        | "couples-tell-all"
        | "custom"
      research_status: "pending" | "in_progress" | "completed" | "failed"
      scout_agent_type:
        | "market_analyst"
        | "competitor_tracker"
        | "trend_watcher"
      subscription_tier: "free" | "creator" | "professional" | "studio"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "todo"
        | "in_progress"
        | "blocked"
        | "completed"
        | "cancelled"
      tool_type: "lexicon" | "composer" | "scout" | "milo"
      v1_document_type: "script" | "notes" | "story" | "beat_sheet"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "create",
        "update",
        "delete",
        "view",
        "share",
        "export",
        "import",
        "generate",
        "research",
        "sync",
      ],
      content_status: [
        "draft",
        "in_review",
        "approved",
        "published",
        "archived",
      ],
      content_type: [
        "article",
        "blog_post",
        "social_post",
        "email",
        "script",
        "story",
        "documentation",
        "marketing_copy",
        "custom",
      ],
      document_type: [
        "beat-sheet",
        "script",
        "notes",
        "field-guide",
        "interview-questions",
      ],
      entity_type: [
        "character",
        "location",
        "event",
        "object",
        "faction",
        "concept",
        "timeline",
      ],
      episode_status: ["draft", "review", "final"],
      project_type: [
        "couples-journey",
        "tell-all",
        "couples-tell-all",
        "custom",
      ],
      research_status: ["pending", "in_progress", "completed", "failed"],
      scout_agent_type: [
        "market_analyst",
        "competitor_tracker",
        "trend_watcher",
      ],
      subscription_tier: ["free", "creator", "professional", "studio"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "completed", "cancelled"],
      tool_type: ["lexicon", "composer", "scout", "milo"],
      v1_document_type: ["script", "notes", "story", "beat_sheet"],
    },
  },
} as const

