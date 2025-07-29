-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate attendance records for same student/enrollment/date
  UNIQUE(student_id, enrollment_id, data_aula)
);

-- Create student_notes table
CREATE TABLE student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'geral' CHECK (tipo IN ('geral', 'comportamento', 'saude', 'financeiro', 'pedagogico')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_enrollment_id ON attendance(enrollment_id);
CREATE INDEX idx_attendance_data_aula ON attendance(data_aula);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX idx_student_notes_created_by ON student_notes(created_by);
CREATE INDEX idx_student_notes_created_at ON student_notes(created_at);

-- Add RLS policies
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Admin can view all attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'funcionario')
    )
  );

CREATE POLICY "Teachers can view attendance for their classes" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN class_teachers ct ON ct.class_id = e.class_id
      JOIN staff s ON s.id = ct.teacher_id
      WHERE e.id = attendance.enrollment_id
      AND s.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert attendance for their classes" ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN class_teachers ct ON ct.class_id = e.class_id
      JOIN staff s ON s.id = ct.teacher_id
      WHERE e.id = attendance.enrollment_id
      AND s.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update attendance for their classes" ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN class_teachers ct ON ct.class_id = e.class_id
      JOIN staff s ON s.id = ct.teacher_id
      WHERE e.id = attendance.enrollment_id
      AND s.id = auth.uid()
    )
  );

-- Student notes policies
CREATE POLICY "Admin can view all student notes" ON student_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'funcionario')
    )
  );

CREATE POLICY "Teachers can view notes for their students" ON student_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN class_teachers ct ON ct.class_id = e.class_id
      JOIN staff s ON s.id = ct.teacher_id
      WHERE e.student_id = student_notes.student_id
      AND s.id = auth.uid()
      AND e.ativa = true
    )
  );

CREATE POLICY "Admin and teachers can insert student notes" ON student_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'funcionario', 'professor')
    )
  );

CREATE POLICY "Users can update their own notes" ON student_notes
  FOR UPDATE USING (created_by = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_updated_at 
  BEFORE UPDATE ON attendance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at 
  BEFORE UPDATE ON student_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();