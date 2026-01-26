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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      connected_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_identifier: string | null
          account_type: string
          created_at: string
          id: string
          institution_name: string | null
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_identifier?: string | null
          account_type: string
          created_at?: string
          id?: string
          institution_name?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_identifier?: string | null
          account_type?: string
          created_at?: string
          id?: string
          institution_name?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          return_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          return_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          return_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_refund_threshold_days: number | null
          display_name: string | null
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_refund_threshold_days?: number | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_refund_threshold_days?: number | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          bank_account_id: string | null
          confirmed_by_user: boolean | null
          created_at: string
          currency: string | null
          id: string
          matched_at: string | null
          return_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          confirmed_by_user?: boolean | null
          created_at?: string
          currency?: string | null
          id?: string
          matched_at?: string | null
          return_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          confirmed_by_user?: boolean | null
          created_at?: string
          currency?: string | null
          id?: string
          matched_at?: string | null
          return_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          currency: string | null
          delivered_at: string | null
          expected_refund_amount: number | null
          id: string
          items: Json | null
          label_created_at: string | null
          notes: string | null
          order_number: string | null
          refund_received_at: string | null
          refund_threshold_days: number | null
          return_initiated_at: string | null
          shipped_at: string | null
          source_email_id: string | null
          status: Database["public"]["Enums"]["return_status"]
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          expected_refund_amount?: number | null
          id?: string
          items?: Json | null
          label_created_at?: string | null
          notes?: string | null
          order_number?: string | null
          refund_received_at?: string | null
          refund_threshold_days?: number | null
          return_initiated_at?: string | null
          shipped_at?: string | null
          source_email_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          expected_refund_amount?: number | null
          id?: string
          items?: Json | null
          label_created_at?: string | null
          notes?: string | null
          order_number?: string | null
          refund_received_at?: string | null
          refund_threshold_days?: number | null
          return_initiated_at?: string | null
          shipped_at?: string | null
          source_email_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking: {
        Row: {
          carrier: string
          created_at: string
          estimated_delivery: string | null
          id: string
          last_location: string | null
          last_update: string | null
          return_id: string
          status: Database["public"]["Enums"]["tracking_status"]
          tracking_history: Json | null
          tracking_number: string
          updated_at: string
        }
        Insert: {
          carrier: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          last_location?: string | null
          last_update?: string | null
          return_id: string
          status?: Database["public"]["Enums"]["tracking_status"]
          tracking_history?: Json | null
          tracking_number: string
          updated_at?: string
        }
        Update: {
          carrier?: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          last_location?: string | null
          last_update?: string | null
          return_id?: string
          status?: Database["public"]["Enums"]["tracking_status"]
          tracking_history?: Json | null
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          average_refund_days: number | null
          created_at: string
          id: string
          name: string
          normalized_name: string
          support_email: string | null
          support_url: string | null
        }
        Insert: {
          average_refund_days?: number | null
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          support_email?: string | null
          support_url?: string | null
        }
        Update: {
          average_refund_days?: number | null
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          support_email?: string | null
          support_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      return_status:
        | "initiated"
        | "label_created"
        | "in_transit"
        | "delivered"
        | "awaiting_refund"
        | "refunded"
        | "disputed"
      tracking_status:
        | "pre_transit"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "exception"
        | "unknown"
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
      return_status: [
        "initiated",
        "label_created",
        "in_transit",
        "delivered",
        "awaiting_refund",
        "refunded",
        "disputed",
      ],
      tracking_status: [
        "pre_transit",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
        "unknown",
      ],
    },
  },
} as const
