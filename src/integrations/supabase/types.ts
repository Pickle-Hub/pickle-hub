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
      blocked_slots: {
        Row: {
          blocked_date: string
          court_id: number | null
          created_at: string
          id: string
          reason: string
          slot_hour: number | null
        }
        Insert: {
          blocked_date: string
          court_id?: number | null
          created_at?: string
          id?: string
          reason?: string
          slot_hour?: number | null
        }
        Update: {
          blocked_date?: string
          court_id?: number | null
          created_at?: string
          id?: string
          reason?: string
          slot_hour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          booking_code?: string
          booking_date: string
          court_id: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_screenshot?: string | null
          payment_status?: string
          players?: number
          slot_hour: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_code?: string
          booking_date?: string
          court_id?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_screenshot?: string | null
          payment_status?: string
          players?: number
          slot_hour?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_items: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      cafe_orders: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          item_id: string | null
          item_name: string
          notes: string | null
          order_code: string
          quantity: number
          status: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          order_code?: string
          quantity?: number
          status?: string
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          order_code?: string
          quantity?: number
          status?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cafe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          active: boolean
          closing_hour: number
          day_rate: number
          evening_rate: number
          evening_start_hour: number
          id: number
          max_players: number
          name: string
          opening_hour: number
          surface: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          closing_hour?: number
          day_rate?: number
          evening_rate?: number
          evening_start_hour?: number
          id: number
          max_players?: number
          name: string
          opening_hour?: number
          surface?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          closing_hour?: number
          day_rate?: number
          evening_rate?: number
          evening_start_hour?: number
          id?: number
          max_players?: number
          name?: string
          opening_hour?: number
          surface?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: boolean
          instructions: string
          qr_image_path: string | null
          updated_at: string
          upi_deep_link: string | null
          upi_id: string
          upi_name: string
        }
        Insert: {
          id?: boolean
          instructions?: string
          qr_image_path?: string | null
          updated_at?: string
          upi_deep_link?: string | null
          upi_id?: string
          upi_name?: string
        }
        Update: {
          id?: boolean
          instructions?: string
          qr_image_path?: string | null
          updated_at?: string
          upi_deep_link?: string | null
          upi_id?: string
          upi_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone_number?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      cancel_booking_by_id: {
        Args: { _id: string }
        Returns: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking: {
        Args: {
          _booking_date: string
          _court_id: number
          _payment_method: string
          _players: number
          _slot_hour: number
        }
        Returns: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_guest_booking: {
        Args: {
          _booking_date: string
          _court_id: number
          _customer_name: string
          _customer_phone: string
          _payment_method: string
          _slot_hour: number
        }
        Returns: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_booking_by_id: {
        Args: { _id: string }
        Returns: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      slot_availability: {
        Args: { _date: string }
        Returns: {
          court_id: number
          slot_hour: number
          state: string
        }[]
      }
      submit_booking_payment: {
        Args: { _id: string; _reference: string }
        Returns: {
          amount: number
          booking_code: string
          booking_date: string
          court_id: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payment_screenshot: string | null
          payment_status: string
          players: number
          slot_hour: number
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
