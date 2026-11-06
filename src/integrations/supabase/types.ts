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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alimentos_taco: {
        Row: {
          busca: string
          carboidrato_g: number | null
          categoria: string | null
          descricao: string
          fibra_g: number | null
          id: number
          kcal: number | null
          lipideos_g: number | null
          proteina_g: number | null
        }
        Insert: {
          busca: string
          carboidrato_g?: number | null
          categoria?: string | null
          descricao: string
          fibra_g?: number | null
          id: number
          kcal?: number | null
          lipideos_g?: number | null
          proteina_g?: number | null
        }
        Update: {
          busca?: string
          carboidrato_g?: number | null
          categoria?: string | null
          descricao?: string
          fibra_g?: number | null
          id?: number
          kcal?: number | null
          lipideos_g?: number | null
          proteina_g?: number | null
        }
        Relationships: []
      }
      alimentos_usda: {
        Row: {
          busca: string
          carboidrato_g: number
          categoria: string | null
          descricao: string
          edicao: string
          fdc_id: number
          gtin_upc: string | null
          kcal: number
          lipideos_g: number
          marca: string | null
          proteina_g: number
        }
        Insert: {
          busca: string
          carboidrato_g: number
          categoria?: string | null
          descricao: string
          edicao?: string
          fdc_id: number
          gtin_upc?: string | null
          kcal: number
          lipideos_g: number
          marca?: string | null
          proteina_g: number
        }
        Update: {
          busca?: string
          carboidrato_g?: number
          categoria?: string | null
          descricao?: string
          edicao?: string
          fdc_id?: number
          gtin_upc?: string | null
          kcal?: number
          lipideos_g?: number
          marca?: string | null
          proteina_g?: number
        }
        Relationships: []
      }
      metas: {
        Row: {
          agua_ml: number | null
          atualizado_em: string
          carboidratos_g: number | null
          gorduras_g: number | null
          id: string
          kcal: number | null
          proteinas_g: number | null
          user_id: string
        }
        Insert: {
          agua_ml?: number | null
          atualizado_em?: string
          carboidratos_g?: number | null
          gorduras_g?: number | null
          id?: string
          kcal?: number | null
          proteinas_g?: number | null
          user_id: string
        }
        Update: {
          agua_ml?: number | null
          atualizado_em?: string
          carboidratos_g?: number | null
          gorduras_g?: number | null
          id?: string
          kcal?: number | null
          proteinas_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          altura_cm: number | null
          atualizado_em: string
          consentimento_saude_em: string | null
          consentimento_saude_versao: string | null
          copo_ml: number
          criado_em: string
          id: string
          idade: number | null
          limites_alerta: Json | null
          objetivo: string | null
          onboarding_concluido: boolean
          peso_kg: number | null
          sexo: string | null
          tema: string
          tom: string
        }
        Insert: {
          altura_cm?: number | null
          atualizado_em?: string
          consentimento_saude_em?: string | null
          consentimento_saude_versao?: string | null
          copo_ml?: number
          criado_em?: string
          id: string
          idade?: number | null
          limites_alerta?: Json | null
          objetivo?: string | null
          onboarding_concluido?: boolean
          peso_kg?: number | null
          sexo?: string | null
          tema?: string
          tom?: string
        }
        Update: {
          altura_cm?: number | null
          atualizado_em?: string
          consentimento_saude_em?: string | null
          consentimento_saude_versao?: string | null
          copo_ml?: number
          criado_em?: string
          id?: string
          idade?: number | null
          limites_alerta?: Json | null
          objetivo?: string | null
          onboarding_concluido?: boolean
          peso_kg?: number | null
          sexo?: string | null
          tema?: string
          tom?: string
        }
        Relationships: []
      }
      registros: {
        Row: {
          alimento_id: number | null
          carboidratos_g: number
          criado_em: string
          descricao: string
          dia: string
          gorduras_g: number
          gramas: number
          id: string
          kcal: number
          origem: string
          proteinas_g: number
          usda_fdc_id: number | null
          user_id: string
        }
        Insert: {
          alimento_id?: number | null
          carboidratos_g?: number
          criado_em?: string
          descricao: string
          dia: string
          gorduras_g?: number
          gramas: number
          id?: string
          kcal?: number
          origem?: string
          proteinas_g?: number
          usda_fdc_id?: number | null
          user_id: string
        }
        Update: {
          alimento_id?: number | null
          carboidratos_g?: number
          criado_em?: string
          descricao?: string
          dia?: string
          gorduras_g?: number
          gramas?: number
          id?: string
          kcal?: number
          origem?: string
          proteinas_g?: number
          usda_fdc_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_alimento_id_fkey"
            columns: ["alimento_id"]
            isOneToOne: false
            referencedRelation: "alimentos_taco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_usda_fdc_id_fkey"
            columns: ["usda_fdc_id"]
            isOneToOne: false
            referencedRelation: "alimentos_usda"
            referencedColumns: ["fdc_id"]
          },
          {
            foreignKeyName: "registros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_alimentos: {
        Args: { q: string }
        Returns: {
          busca: string
          carboidrato_g: number | null
          categoria: string | null
          descricao: string
          fibra_g: number | null
          id: number
          kcal: number | null
          lipideos_g: number | null
          proteina_g: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "alimentos_taco"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      buscar_alimentos_catalogo: {
        Args: { fonte?: string; q: string }
        Returns: {
          carboidrato_g: number
          descricao: string
          fonte: string
          gtin_upc: string
          id: number
          kcal: number
          lipideos_g: number
          marca: string
          proteina_g: number
        }[]
      }
      buscar_usda: {
        Args: { termo: string }
        Returns: {
          busca: string
          carboidrato_g: number
          categoria: string | null
          descricao: string
          edicao: string
          fdc_id: number
          gtin_upc: string | null
          kcal: number
          lipideos_g: number
          marca: string | null
          proteina_g: number
        }[]
        SetofOptions: {
          from: "*"
          to: "alimentos_usda"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      tem_consentimento_saude: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
