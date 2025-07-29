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