-- Add sala and comissao_percentual columns to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS sala TEXT,
ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5,2) DEFAULT 10.00;

-- Update existing classes with default commission
UPDATE classes 
SET comissao_percentual = 10.00 
WHERE comissao_percentual IS NULL;

-- Comment on new columns
COMMENT ON COLUMN classes.sala IS 'Nome ou número da sala onde a turma acontece';
COMMENT ON COLUMN classes.comissao_percentual IS 'Percentual de comissão do professor principal (0-100)';