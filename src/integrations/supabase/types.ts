export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          priority: string
          published: boolean
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          priority?: string
          published?: boolean
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          priority?: string
          published?: boolean
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_teachers: {
        Row: {
          class_id: string
          comissao_percentual: number
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          comissao_percentual?: number
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          comissao_percentual?: number
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          active: boolean | null
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          ativa: boolean
          capacidade_maxima: number | null
          created_at: string
          data_inicio: string
          data_termino: string | null
          dias_semana: string[]
          horario_fim: string
          horario_inicio: string
          id: string
          modalidade: string
          nivel: Database["public"]["Enums"]["nivel_turma"]
          nome: string | null
          observacoes: string | null
          professor_principal_id: string | null
          sala: string | null
          tempo_total_minutos: number
          tipo: Database["public"]["Enums"]["tipo_turma"]
          updated_at: string
          valor_aula: number
          valor_matricula: number | null
        }
        Insert: {
          ativa?: boolean
          capacidade_maxima?: number | null
          created_at?: string
          data_inicio: string
          data_termino?: string | null
          dias_semana: string[]
          horario_fim: string
          horario_inicio: string
          id?: string
          modalidade: string
          nivel: Database["public"]["Enums"]["nivel_turma"]
          nome?: string | null
          observacoes?: string | null
          professor_principal_id?: string | null
          sala?: string | null
          tempo_total_minutos: number
          tipo: Database["public"]["Enums"]["tipo_turma"]
          updated_at?: string
          valor_aula: number
          valor_matricula?: number | null
        }
        Update: {
          ativa?: boolean
          capacidade_maxima?: number | null
          created_at?: string
          data_inicio?: string
          data_termino?: string | null
          dias_semana?: string[]
          horario_fim?: string
          horario_inicio?: string
          id?: string
          modalidade?: string
          nivel?: Database["public"]["Enums"]["nivel_turma"]
          nome?: string | null
          observacoes?: string | null
          professor_principal_id?: string | null
          sala?: string | null
          tempo_total_minutos?: number
          tipo?: Database["public"]["Enums"]["tipo_turma"]
          updated_at?: string
          valor_aula?: number
          valor_matricula?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_professor_principal_id_fkey"
            columns: ["professor_principal_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          ativa: boolean
          class_id: string
          created_at: string
          data_matricula: string
          id: string
          student_id: string
          updated_at: string
          valor_pago_matricula: number | null
        }
        Insert: {
          ativa?: boolean
          class_id: string
          created_at?: string
          data_matricula?: string
          id?: string
          student_id: string
          updated_at?: string
          valor_pago_matricula?: number | null
        }
        Update: {
          ativa?: boolean
          class_id?: string
          created_at?: string
          data_matricula?: string
          id?: string
          student_id?: string
          updated_at?: string
          valor_pago_matricula?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          created_at: string
          description: string | null
          due_date: string
          enrollment_id: string | null
          id: string
          paid_date: string | null
          payment_method: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          enrollment_id?: string | null
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          enrollment_id?: string | null
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cep: string | null
          cidade: string | null
          contato_emergencia: string | null
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string
          email_confirmation_sent_at: string | null
          email_confirmation_token: string | null
          email_confirmed: boolean | null
          endereco: string | null
          estado: string | null
          id: string
          informacoes_medicas: string | null
          nome_completo: string
          observacoes: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          telefone_emergencia: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          contato_emergencia?: string | null
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email: string
          email_confirmation_sent_at?: string | null
          email_confirmation_token?: string | null
          email_confirmed?: boolean | null
          endereco?: string | null
          estado?: string | null
          id: string
          informacoes_medicas?: string | null
          nome_completo: string
          observacoes?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefone_emergencia?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          contato_emergencia?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string
          email_confirmation_sent_at?: string | null
          email_confirmation_token?: string | null
          email_confirmed?: boolean | null
          endereco?: string | null
          estado?: string | null
          id?: string
          informacoes_medicas?: string | null
          nome_completo?: string
          observacoes?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefone_emergencia?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          chave_pix: string | null
          created_at: string
          dados_bancarios: Json | null
          especialidades: string[] | null
          funcao: Database["public"]["Enums"]["user_role"]
          id: string
          observacoes: string | null
          taxa_comissao: number | null
          updated_at: string
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          especialidades?: string[] | null
          funcao: Database["public"]["Enums"]["user_role"]
          id: string
          observacoes?: string | null
          taxa_comissao?: number | null
          updated_at?: string
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          especialidades?: string[] | null
          funcao?: Database["public"]["Enums"]["user_role"]
          id?: string
          observacoes?: string | null
          taxa_comissao?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          auth_status: string
          created_at: string
          data_nascimento: string | null
          endereco_completo: string | null
          id: string
          parceiro_id: string | null
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          sexo: Database["public"]["Enums"]["sexo"]
          updated_at: string
        }
        Insert: {
          auth_status?: string
          created_at?: string
          data_nascimento?: string | null
          endereco_completo?: string | null
          id: string
          parceiro_id?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          sexo: Database["public"]["Enums"]["sexo"]
          updated_at?: string
        }
        Update: {
          auth_status?: string
          created_at?: string
          data_nascimento?: string | null
          endereco_completo?: string | null
          id?: string
          parceiro_id?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          sexo?: Database["public"]["Enums"]["sexo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parceiro_id_fkey"
            columns: ["parceiro_id"]
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
      ensure_student_record: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      nivel_turma: "basico" | "intermediario" | "avancado"
      sexo: "masculino" | "feminino" | "outro"
      tipo_turma: "regular" | "workshop" | "particular" | "outra"
      user_role: "admin" | "professor" | "funcionario" | "aluno"
      user_status: "ativo" | "inativo"
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
      nivel_turma: ["basico", "intermediario", "avancado"],
      sexo: ["masculino", "feminino", "outro"],
      tipo_turma: ["regular", "workshop", "particular", "outra"],
      user_role: ["admin", "professor", "funcionario", "aluno"],
      user_status: ["ativo", "inativo"],
    },
  },
} as const
