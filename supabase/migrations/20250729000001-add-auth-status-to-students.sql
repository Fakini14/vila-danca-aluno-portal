-- Add auth_status field to students table
ALTER TABLE students ADD COLUMN auth_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (auth_status IN ('pending', 'active'));

-- Add index for better performance
CREATE INDEX idx_students_auth_status ON students(auth_status);

-- Update existing students to 'active' status (they already have auth accounts)
UPDATE students SET auth_status = 'active' WHERE id IN (
  SELECT id FROM auth.users
);

-- Add comment to document the field
COMMENT ON COLUMN students.auth_status IS 'Status da conta de autenticação: pending (aguardando registro) ou active (conta ativa)';

-- Update RLS policies to account for auth_status
-- Allow admin to see all students regardless of auth_status
CREATE POLICY "Admin can view all students regardless of auth_status" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'funcionario')
    )
  );

-- Students can only see their own data when active
CREATE POLICY "Students can view own data when active" ON students
  FOR SELECT USING (
    id = auth.uid() AND auth_status = 'active'
  );

-- Students can update their own data when active  
CREATE POLICY "Students can update own data when active" ON students
  FOR UPDATE USING (
    id = auth.uid() AND auth_status = 'active'
  );

-- Function to automatically set auth_status to 'active' when user confirms email
CREATE OR REPLACE FUNCTION handle_student_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user confirms their email, mark them as active if they're a student
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE students 
    SET auth_status = 'active' 
    WHERE id = NEW.id AND auth_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users for email confirmation
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_student_email_confirmation();