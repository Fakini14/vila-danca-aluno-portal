-- Migration: 20250803153045_create_subscription_tables.sql
-- Criar tabelas para gerenciar assinaturas do Asaas

-- Tabela principal de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) UNIQUE NOT NULL,
  asaas_subscription_id TEXT UNIQUE NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled', 'overdue')) NOT NULL DEFAULT 'active',
  billing_type TEXT CHECK (billing_type IN ('CREDIT_CARD', 'PIX', 'BOLETO')) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  cycle TEXT DEFAULT 'MONTHLY' CHECK (cycle IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY')),
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  reactivated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para histórico de pagamentos
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
  asaas_payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL,
  payment_method TEXT,
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices otimizados
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_due ON subscriptions(next_due_date);
CREATE INDEX idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id);
CREATE INDEX idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_asaas_id ON subscription_payments(asaas_payment_id);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para subscriptions
CREATE POLICY "Students can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Staff can view all subscriptions" ON subscriptions
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'funcionario'));

-- Políticas para subscription_payments
CREATE POLICY "Students can view own payments" ON subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE subscriptions.id = subscription_payments.subscription_id 
      AND subscriptions.student_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all payments" ON subscription_payments
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'funcionario'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE
    ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();