-- Create enum types for better data consistency
CREATE TYPE public.user_role AS ENUM ('admin', 'professor', 'funcionario', 'aluno');
CREATE TYPE public.user_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.sexo AS ENUM ('masculino', 'feminino', 'outro');
CREATE TYPE public.nivel_turma AS ENUM ('basico', 'intermediario', 'avancado');
CREATE TYPE public.tipo_turma AS ENUM ('regular', 'workshop', 'particular', 'outra');

-- Create profiles table for all users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'aluno',
  status public.user_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table (extends profiles for students)
CREATE TABLE public.students (
  id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  sexo public.sexo NOT NULL,
  parceiro_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff table (extends profiles for admin/professor/funcionario)
CREATE TABLE public.staff (
  id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  funcao public.user_role NOT NULL CHECK (funcao IN ('admin', 'professor', 'funcionario')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade TEXT NOT NULL,
  nivel public.nivel_turma NOT NULL,
  tipo public.tipo_turma NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE,
  dias_semana TEXT[] NOT NULL, -- Array of days like ['segunda', 'quarta']
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  tempo_total_minutos INTEGER NOT NULL,
  valor_aula DECIMAL(10,2) NOT NULL,
  valor_matricula DECIMAL(10,2) DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_teachers table (many-to-many between classes and teachers)
CREATE TABLE public.class_teachers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  comissao_percentual DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);

-- Create enrollments table (many-to-many between students and classes)
CREATE TABLE public.enrollments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  valor_pago_matricula DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'funcionario')
  );

-- RLS Policies for students
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all students" ON public.students
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'professor', 'funcionario')
  );

CREATE POLICY "Staff can manage students" ON public.students
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'funcionario')
  );

-- RLS Policies for staff
CREATE POLICY "Staff can view all staff" ON public.staff
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'professor', 'funcionario')
  );

CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- RLS Policies for classes
CREATE POLICY "Everyone can view active classes" ON public.classes
  FOR SELECT USING (ativa = true);

CREATE POLICY "Staff can manage classes" ON public.classes
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'funcionario')
  );

-- RLS Policies for class_teachers
CREATE POLICY "Everyone can view class teachers" ON public.class_teachers
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage class teachers" ON public.class_teachers
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'funcionario')
  );

-- RLS Policies for enrollments
CREATE POLICY "Students can view their enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.uid() = student_id OR 
    public.get_user_role(auth.uid()) IN ('admin', 'professor', 'funcionario')
  );

CREATE POLICY "Staff can manage enrollments" ON public.enrollments
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'funcionario')
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    nome_completo, 
    cpf, 
    whatsapp, 
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'aluno'),
    'ativo'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update triggers for updated_at fields
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();