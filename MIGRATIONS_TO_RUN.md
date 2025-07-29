# 🔧 Migrações SQL para Executar no Supabase

Este arquivo contém as migrações SQL que precisam ser executadas no painel do Supabase para atualizar a estrutura do banco de dados.

## ⚠️ IMPORTANTE
Execute essas migrações na ordem exata apresentada abaixo no painel do Supabase (SQL Editor).

## 📋 Migração: Adicionar Campos Missing

**Arquivo de referência:** `supabase/migrations/20250728000000-add-birthday-fields.sql`

```sql
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
```

## 📋 Como Executar

1. **Acesse o Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Selecione seu projeto**: `eqhouenplcddjtqapurn`
3. **Vá para SQL Editor**: Menu lateral > SQL Editor
4. **Cole e execute**: Cole o SQL acima e clique em "Run"

## ✅ Verificação

Após executar a migração, você pode verificar se os campos foram criados corretamente executando:

```sql
-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela staff
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela students
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela classes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;
```

## 🚨 Dados de Teste (Opcional)

Se desejar adicionar alguns dados de teste para aniversariantes:

```sql
-- Inserir alguns dados de teste para profiles (OPCIONAL)
UPDATE public.profiles 
SET data_nascimento = '1990-07-28'
WHERE email = 'admin@viladanca.com' AND data_nascimento IS NULL;

-- Você pode repetir para outros usuários de teste
```

## 🔄 Status

- [ ] Migração executada no Supabase
- [ ] Campos verificados
- [ ] Aplicação testada com novos campos
- [ ] Dados de aniversariantes funcionando

---

**Próximo Passo**: Após executar essas migrações, os componentes de aniversariantes e toda a estrutura estará pronta para a gestão de professores.

## 📋 Migração: Criar Tabela de Modalidades (class_types)

**Arquivo de referência:** `supabase/migrations/20250728232906_add_class_types_table.sql`

```sql
-- Create class_types table
CREATE TABLE IF NOT EXISTS public.class_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#6366F1', -- Default to indigo
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_class_types_updated_at
  BEFORE UPDATE ON public.class_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.class_types
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users" ON public.class_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admin users" ON public.class_types
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admin users" ON public.class_types
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default class types
INSERT INTO public.class_types (name, color, description) VALUES
  ('Ballet', '#FFB6C1', 'Técnica clássica de dança'),
  ('Jazz', '#FF6B6B', 'Dança moderna e energética'),
  ('Contemporâneo', '#4ECDC4', 'Dança expressiva e fluida'),
  ('Hip Hop', '#FFD93D', 'Dança urbana e street dance'),
  ('Dança de Salão', '#95E1D3', 'Danças sociais em pares'),
  ('Sapateado', '#A8E6CF', 'Dança rítmica com sapatos especiais'),
  ('Teatro Musical', '#C7CEEA', 'Integração de dança, canto e teatro'),
  ('Dança do Ventre', '#FFDAB9', 'Dança tradicional oriental'),
  ('Zumba', '#FFA07A', 'Fitness com ritmos latinos'),
  ('Fitness Dance', '#98FB98', 'Dança focada em condicionamento físico')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint to classes table
ALTER TABLE public.classes 
  DROP CONSTRAINT IF EXISTS classes_modalidade_fkey;

-- Create index on class_types name for better performance
CREATE INDEX IF NOT EXISTS idx_class_types_name ON public.class_types(name);

-- Comment on table
COMMENT ON TABLE public.class_types IS 'Tipos de modalidades de dança oferecidas pela escola';
```

## ✅ Verificação para class_types

Após executar a migração de class_types, você pode verificar se a tabela foi criada corretamente:

```sql
-- Verificar estrutura da tabela class_types
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'class_types' 
ORDER BY ordinal_position;

-- Verificar modalidades inseridas
SELECT * FROM public.class_types ORDER BY name;
```