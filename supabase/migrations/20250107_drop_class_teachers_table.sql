-- Drop class_teachers table
-- This table is no longer needed as we now use professor_principal_id directly in the classes table
-- All functionality has been migrated to use the professor_principal_id column

-- Drop the table with CASCADE to remove any dependent objects
DROP TABLE IF EXISTS public.class_teachers CASCADE;

-- Add comment to document this change
COMMENT ON COLUMN classes.professor_principal_id IS 'ID do professor principal responsável pela turma';
COMMENT ON COLUMN classes.comissao_percentual IS 'Percentual de comissão do professor principal (0-100) - migrado da tabela class_teachers';