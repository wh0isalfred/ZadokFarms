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
      customers: {
        Row: {
          created_at: string
          delivery_address: string | null
          email: string | null
          full_name: string
          id: string
          internal_notes: string | null
          marketing_consent: boolean
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          email?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          marketing_consent?: boolean
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          email?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          marketing_consent?: boolean
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string | null
          note: string | null
          occurred_at: string
          order_id: string | null
          performed_by: string | null
          product_id: string
          quantity_delta: number
          reason: Database["public"]["Enums"]["inventory_adjustment_reason"]
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          note?: string | null
          occurred_at?: string
          order_id?: string | null
          performed_by?: string | null
          product_id: string
          quantity_delta: number
          reason: Database["public"]["Enums"]["inventory_adjustment_reason"]
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          note?: string | null
          occurred_at?: string
          order_id?: string | null
          performed_by?: string | null
          product_id?: string
          quantity_delta?: number
          reason?: Database["public"]["Enums"]["inventory_adjustment_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          confirmed_quantity: number | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selling_unit: string
          unit_price_ngn: number
        }
        Insert: {
          confirmed_quantity?: number | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          selling_unit: string
          unit_price_ngn: number
        }
        Update: {
          confirmed_quantity?: number | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selling_unit?: string
          unit_price_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_requests: {
        Row: {
          confirmed_at: string | null
          created_at: string
          customer_id: string
          customer_note: string | null
          delivery_address: string | null
          fulfilled_at: string | null
          fulfilment_method: string | null
          id: string
          idempotency_key: string | null
          internal_note: string | null
          reference: string
          requested_at: string
          reservation_expires_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          wholesale: boolean
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          customer_note?: string | null
          delivery_address?: string | null
          fulfilled_at?: string | null
          fulfilment_method?: string | null
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          reference: string
          requested_at?: string
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          wholesale?: boolean
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          customer_note?: string | null
          delivery_address?: string | null
          fulfilled_at?: string | null
          fulfilment_method?: string | null
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          reference?: string
          requested_at?: string
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          wholesale?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "order_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: number
          note: string | null
          order_id: string
          performed_by: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id: string
          performed_by?: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id?: string
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          product_id: string
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          id: string
          image_alt: string | null
          image_path: string | null
          minimum_quantity: number
          name: string
          price_ngn: number
          price_prefix: string | null
          published_at: string | null
          quantity_step: number
          selling_unit: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_path?: string | null
          minimum_quantity?: number
          name: string
          price_ngn: number
          price_prefix?: string | null
          published_at?: string | null
          quantity_step?: number
          selling_unit: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_path?: string | null
          minimum_quantity?: number
          name?: string
          price_ngn?: number
          price_prefix?: string | null
          published_at?: string | null
          quantity_step?: number
          selling_unit?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_inventory: {
        Row: {
          last_adjusted_at: string | null
          product_id: string | null
          quantity_on_hand: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      submit_order_request: {
        Args: {
          p_fingerprint: string
          p_key: string
          p_payload: Json
          p_phone_hash: string
        }
        Returns: Json
      }
    }
    Enums: {
      inventory_adjustment_reason:
        | "harvest"
        | "order_reserved"
        | "reservation_released"
        | "order_fulfilled"
        | "spoilage"
        | "correction"
        | "physical_count"
      order_status:
        | "submitted"
        | "awaiting_availability"
        | "partially_available"
        | "confirmed"
        | "awaiting_payment"
        | "paid"
        | "preparing"
        | "ready"
        | "fulfilled"
        | "expired"
        | "declined"
        | "cancelled"
      product_status:
        | "available"
        | "limited"
        | "unavailable"
        | "draft"
        | "archived"
      staff_role: "owner" | "admin" | "staff"
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
      inventory_adjustment_reason: [
        "harvest",
        "order_reserved",
        "reservation_released",
        "order_fulfilled",
        "spoilage",
        "correction",
        "physical_count",
      ],
      order_status: [
        "submitted",
        "awaiting_availability",
        "partially_available",
        "confirmed",
        "awaiting_payment",
        "paid",
        "preparing",
        "ready",
        "fulfilled",
        "expired",
        "declined",
        "cancelled",
      ],
      product_status: [
        "available",
        "limited",
        "unavailable",
        "draft",
        "archived",
      ],
      staff_role: ["owner", "admin", "staff"],
    },
  },
} as const
