-- Add birthday and additional fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS contato_emergencia TEXT,
ADD COLUMN IF NOT EXISTS telefone_emergencia VARCHAR(20),
ADD COLUMN IF NOT EXISTS informacoes_medicas TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Create index for birthday queries
CREATE INDEX IF NOT EXISTS idx_profiles_data_nascimento 
ON public.profiles(data_nascimento) 
WHERE data_nascimento IS NOT NULL;

-- Add missing fields to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS sala TEXT,
ADD COLUMN IF NOT EXISTS capacidade_maxima INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS professor_principal_id UUID REFERENCES public.staff(id),
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Update existing classes to have a name (generate from modalidade + nivel)
UPDATE public.classes 
SET nome = COALESCE(nome, modalidade || ' - ' || nivel)
WHERE nome IS NULL OR nome = '';

-- Add missing fields to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS responsavel_email TEXT;

-- Add missing fields to staff table for teachers
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS especialidades TEXT[], -- Array de modalidades que ensina
ADD COLUMN IF NOT EXISTS taxa_comissao DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS dados_bancarios JSONB, -- Dados para pagamento
ADD COLUMN IF NOT EXISTS chave_pix TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_data_nascimento 
ON public.students(data_nascimento) 
WHERE data_nascimento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_especialidades 
ON public.staff USING GIN(especialidades) 
WHERE especialidades IS NOT NULL;

-- Update RLS policies to include new fields (if needed)
-- These policies should already cover the new fields as they use SELECT/UPDATE *