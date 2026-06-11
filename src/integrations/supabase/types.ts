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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: { user_id: string; granted_at: string; granted_by: string | null }
        Insert: { user_id: string; granted_at?: string; granted_by?: string | null }
        Update: { user_id?: string; granted_at?: string; granted_by?: string | null }
        Relationships: []
      }
      subscriptions: {
        Row: {
          user_id: string; plan: string; status: string; tenant_slots: number
          expires_at: string | null; notes: string | null; updated_by: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          user_id: string; plan?: string; status?: string; tenant_slots?: number
          expires_at?: string | null; notes?: string | null; updated_by?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          user_id?: string; plan?: string; status?: string; tenant_slots?: number
          expires_at?: string | null; notes?: string | null; updated_by?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          id: string; user_id: string; amount_npr: number; method: string
          reference: string | null; note: string | null
          period_from: string | null; period_to: string | null
          recorded_by: string | null; paid_at: string; created_at: string
        }
        Insert: {
          id?: string; user_id: string; amount_npr: number; method?: string
          reference?: string | null; note?: string | null
          period_from?: string | null; period_to?: string | null
          recorded_by?: string | null; paid_at?: string; created_at?: string
        }
        Update: {
          id?: string; user_id?: string; amount_npr?: number; method?: string
          reference?: string | null; note?: string | null
          period_from?: string | null; period_to?: string | null
          recorded_by?: string | null; paid_at?: string; created_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: { key: string; value: Json; updated_by: string | null; updated_at: string }
        Insert: { key: string; value?: Json; updated_by?: string | null; updated_at?: string }
        Update: { key?: string; value?: Json; updated_by?: string | null; updated_at?: string }
        Relationships: []
      }

      additional_charges: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          label: string
          owner_id: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          label: string
          owner_id?: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_charges_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bs_month: number
          bs_year: number
          carry_forward_credit: number
          created_at: string
          electricity_curr_reading: number | null
          electricity_direct_amount: number | null
          electricity_mode: Database["public"]["Enums"]["electricity_mode"]
          electricity_prev_reading: number | null
          electricity_rate_snapshot: number | null
          electricity_service_charge: number
          id: string
          last_modified_at: string
          notes: string | null
          owner_id: string
          rent_this_month: number
          share_token: string
          tenant_id: string
          water_bill: number
        }
        Insert: {
          bs_month: number
          bs_year: number
          carry_forward_credit?: number
          created_at?: string
          electricity_curr_reading?: number | null
          electricity_direct_amount?: number | null
          electricity_mode?: Database["public"]["Enums"]["electricity_mode"]
          electricity_prev_reading?: number | null
          electricity_rate_snapshot?: number | null
          electricity_service_charge?: number
          id?: string
          last_modified_at?: string
          notes?: string | null
          owner_id?: string
          rent_this_month?: number
          share_token?: string
          tenant_id: string
          water_bill?: number
        }
        Update: {
          bs_month?: number
          bs_year?: number
          carry_forward_credit?: number
          created_at?: string
          electricity_curr_reading?: number | null
          electricity_direct_amount?: number | null
          electricity_mode?: Database["public"]["Enums"]["electricity_mode"]
          electricity_prev_reading?: number | null
          electricity_rate_snapshot?: number | null
          electricity_service_charge?: number
          id?: string
          last_modified_at?: string
          notes?: string | null
          owner_id?: string
          rent_this_month?: number
          share_token?: string
          tenant_id?: string
          water_bill?: number
        }
        Relationships: [
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string
          id: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name: string
          id?: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string
          id?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paid: number
          bill_id: string
          created_at: string
          id: string
          note: string | null
          owner_id: string
          payment_date_bs: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          amount_paid: number
          bill_id: string
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          payment_date_bs: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          amount_paid?: number
          bill_id?: string
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          payment_date_bs?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          base_rent: number | null
          created_at: string
          default_water_bill: number | null
          documents: Json
          id: string
          is_active: boolean
          move_in_date_bs: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          photo_url: string | null
          room_number: string | null
        }
        Insert: {
          base_rent?: number | null
          created_at?: string
          default_water_bill?: number | null
          documents?: Json
          id?: string
          is_active?: boolean
          move_in_date_bs?: string | null
          name: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          room_number?: string | null
        }
        Update: {
          base_rent?: number | null
          created_at?: string
          default_water_bill?: number | null
          documents?: Json
          id?: string
          is_active?: boolean
          move_in_date_bs?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          room_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_slots: {
        Args: { uid: string }
        Returns: number
      }
      is_current_user_super_admin: {
        Args: never
        Returns: boolean
      }
      is_super_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      get_all_user_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
    }
    Enums: {
      electricity_mode: "per_unit" | "direct"
      payment_method: "cash" | "bank" | "esewa" | "khalti" | "other"
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
      electricity_mode: ["per_unit", "direct"],
      payment_method: ["cash", "bank", "esewa", "khalti", "other"],
    },
  },
} as const
