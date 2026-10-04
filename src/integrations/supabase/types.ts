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
      billboard_availability: {
        Row: {
          billboard_id: string
          created_at: string
          end_date: string
          id: string
          is_available: boolean
          note: string | null
          start_date: string
        }
        Insert: {
          billboard_id: string
          created_at?: string
          end_date: string
          id?: string
          is_available?: boolean
          note?: string | null
          start_date: string
        }
        Update: {
          billboard_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_available?: boolean
          note?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "billboard_availability_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
        ]
      }
      billboard_images: {
        Row: {
          alt_text: string | null
          billboard_id: string
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          storage_path: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          billboard_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          storage_path?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          billboard_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "billboard_images_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
        ]
      }
      billboards: {
        Row: {
          address: string
          area: string | null
          availability: Database["public"]["Enums"]["availability_status"]
          billboard_type: Database["public"]["Enums"]["billboard_type"]
          city: string
          country: string
          created_at: string
          currency: string
          description: string | null
          dimension_unit: Database["public"]["Enums"]["dimension_unit"]
          height: number
          id: string
          is_featured: boolean
          is_illuminated: boolean
          is_visible: boolean
          latitude: number
          longitude: number
          owner_id: string
          price: number
          price_period: Database["public"]["Enums"]["price_period"]
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          width: number
        }
        Insert: {
          address: string
          area?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          billboard_type?: Database["public"]["Enums"]["billboard_type"]
          city: string
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          dimension_unit?: Database["public"]["Enums"]["dimension_unit"]
          height: number
          id?: string
          is_featured?: boolean
          is_illuminated?: boolean
          is_visible?: boolean
          latitude: number
          longitude: number
          owner_id: string
          price: number
          price_period?: Database["public"]["Enums"]["price_period"]
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          width: number
        }
        Update: {
          address?: string
          area?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          billboard_type?: Database["public"]["Enums"]["billboard_type"]
          city?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          dimension_unit?: Database["public"]["Enums"]["dimension_unit"]
          height?: number
          id?: string
          is_featured?: boolean
          is_illuminated?: boolean
          is_visible?: boolean
          latitude?: number
          longitude?: number
          owner_id?: string
          price?: number
          price_period?: Database["public"]["Enums"]["price_period"]
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          advertiser_id: string
          billboard_id: string
          company_name: string | null
          contact_phone: string | null
          created_at: string
          end_date: string
          estimated_total: number | null
          id: string
          message: string | null
          owner_id: string
          owner_response: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          billboard_id: string
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          end_date: string
          estimated_total?: number | null
          id?: string
          message?: string | null
          owner_id: string
          owner_response?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          billboard_id?: string
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          end_date?: string
          estimated_total?: number | null
          id?: string
          message?: string | null
          owner_id?: string
          owner_response?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advertiser_id: string
          billboard_id: string
          created_at: string
          currency: string
          end_date: string
          id: string
          owner_id: string
          request_id: string | null
          start_date: string
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          billboard_id: string
          created_at?: string
          currency?: string
          end_date: string
          id?: string
          owner_id: string
          request_id?: string | null
          start_date: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          billboard_id?: string
          created_at?: string
          currency?: string
          end_date?: string
          id?: string
          owner_id?: string
          request_id?: string | null
          start_date?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          payee_id: string
          payer_id: string
          platform_fee: number
          provider: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          payee_id: string
          payer_id: string
          platform_fee?: number
          provider?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          payee_id?: string
          payer_id?: string
          platform_fee?: number
          provider?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_billboards: {
        Row: {
          billboard_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          billboard_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          billboard_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_billboards_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      billboard_is_public: { Args: { _billboard_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      owns_billboard: { Args: { _billboard_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "owner" | "advertiser"
      availability_status: "available" | "booked" | "unavailable"
      billboard_type:
        | "highway"
        | "digital"
        | "roadside"
        | "in_mall"
        | "transit"
        | "wall_wrap"
        | "gantry"
        | "rooftop"
      booking_status: "pending" | "accepted" | "rejected" | "cancelled"
      dimension_unit: "ft" | "m"
      listing_status:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "suspended"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      price_period: "daily" | "weekly" | "monthly" | "yearly"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "owner", "advertiser"],
      availability_status: ["available", "booked", "unavailable"],
      billboard_type: [
        "highway",
        "digital",
        "roadside",
        "in_mall",
        "transit",
        "wall_wrap",
        "gantry",
        "rooftop",
      ],
      booking_status: ["pending", "accepted", "rejected", "cancelled"],
      dimension_unit: ["ft", "m"],
      listing_status: [
        "draft",
        "pending",
        "published",
        "rejected",
        "suspended",
      ],
      payment_status: ["pending", "paid", "refunded", "failed"],
      price_period: ["daily", "weekly", "monthly", "yearly"],
    },
  },
} as const
