// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  EMAIL_INVALID: 'Email inválido',
  CPF_INVALID: 'CPF deve ter 11 dígitos',
  PHONE_INVALID: 'Telefone deve ter pelo menos 10 dígitos',
  PASSWORD_MIN: 'Senha deve ter pelo menos 6 caracteres',
  NAME_MIN: 'Nome deve ter pelo menos 2 caracteres',
  VALUE_MIN: 'Valor deve ser maior que zero',
  DATE_INVALID: 'Data inválida',
  SELECT_OPTION: 'Selecione uma opção',
  SELECT_AT_LEAST_ONE: 'Selecione pelo menos uma opção',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  STUDENT_CREATED: 'Aluno criado com sucesso!',
  STUDENT_UPDATED: 'Aluno atualizado com sucesso!',
  STUDENT_APPROVED: 'Aluno aprovado com sucesso!',
  STUDENT_REJECTED: 'Aluno rejeitado',
  
  TEACHER_CREATED: 'Professor criado com sucesso!',
  TEACHER_UPDATED: 'Professor atualizado com sucesso!',
  TEACHER_DEACTIVATED: 'Professor desativado com sucesso!',
  
  CLASS_CREATED: 'Turma criada com sucesso!',
  CLASS_UPDATED: 'Turma atualizada com sucesso!',
  CLASS_DEACTIVATED: 'Turma desativada com sucesso!',
  
  CLASS_TYPE_CREATED: 'Modalidade criada com sucesso!',
  CLASS_TYPE_UPDATED: 'Modalidade atualizada com sucesso!',
  
  ENROLLMENT_CREATED: 'Matrícula realizada com sucesso!',
  ENROLLMENT_CANCELLED: 'Matrícula cancelada com sucesso!',
  
  PAYMENT_CREATED: 'Pagamento registrado com sucesso!',
  PAYMENT_CONFIRMED: 'Pagamento confirmado com sucesso!',
  
  NOTE_ADDED: 'Nota adicionada com sucesso!',
  NOTE_UPDATED: 'Nota atualizada com sucesso!',
  NOTE_DELETED: 'Nota removida com sucesso!',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  PERMISSION_DENIED: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Item não encontrado.',
  
  STUDENT_CREATE: 'Erro ao criar aluno',
  STUDENT_UPDATE: 'Erro ao atualizar aluno',
  STUDENT_DELETE: 'Erro ao excluir aluno',
  
  TEACHER_CREATE: 'Erro ao criar professor',
  TEACHER_UPDATE: 'Erro ao atualizar professor',
  TEACHER_DELETE: 'Erro ao excluir professor',
  
  CLASS_CREATE: 'Erro ao criar turma',
  CLASS_UPDATE: 'Erro ao atualizar turma',
  CLASS_DELETE: 'Erro ao excluir turma',
  
  PAYMENT_CREATE: 'Erro ao processar pagamento',
  PAYMENT_FAILED: 'Pagamento não foi aprovado',
  
  ENROLLMENT_CREATE: 'Erro ao realizar matrícula',
  ENROLLMENT_CONFLICT: 'Conflito de horário detectado',
  ENROLLMENT_FULL: 'Turma já está lotada',
} as const;

// Form placeholders
export const PLACEHOLDERS = {
  NAME: 'Digite o nome completo',
  EMAIL: 'exemplo@email.com',
  CPF: '000.000.000-00',
  PHONE: '(11) 99999-9999',
  ADDRESS: 'Rua, número, bairro, cidade',
  MEDICAL_INFO: 'Alergias, medicamentos, restrições...',
  EMERGENCY_CONTACT: 'Nome e telefone do contato de emergência',
  OBSERVATIONS: 'Observações adicionais...',
  PASSWORD: 'Mínimo 6 caracteres',
  CONFIRM_PASSWORD: 'Confirme sua senha',
  CLASS_NAME: 'Nome da turma (opcional)',
  CLASS_ROOM: 'Sala ou local da aula',
  CLASS_CAPACITY: 'Número máximo de alunos',
  CLASS_VALUE: 'Valor mensal em reais',
  COMMISSION_RATE: 'Porcentagem de comissão (0-100)',
  PIX_KEY: 'Chave PIX (CPF, email, telefone ou aleatória)',
  BANK_NAME: 'Nome do banco',
  BANK_AGENCY: 'Agência (com dígito)',
  BANK_ACCOUNT: 'Conta (com dígito)',
  SEARCH: 'Buscar...',
  SELECT_OPTION: 'Selecione uma opção',
} as const;

// Form field labels
export const LABELS = {
  NAME: 'Nome Completo',
  EMAIL: 'Email',
  CPF: 'CPF',
  PHONE: 'WhatsApp',
  BIRTH_DATE: 'Data de Nascimento',
  ADDRESS: 'Endereço',
  MEDICAL_INFO: 'Informações Médicas',
  EMERGENCY_CONTACT: 'Contato de Emergência',
  PASSWORD: 'Senha',
  CONFIRM_PASSWORD: 'Confirmar Senha',
  CLASS_NAME: 'Nome da Turma',
  CLASS_TYPE: 'Modalidade',
  CLASS_LEVEL: 'Nível',
  CLASS_DAYS: 'Dias da Semana',
  CLASS_START_TIME: 'Horário de Início',
  CLASS_END_TIME: 'Horário de Término',
  CLASS_ROOM: 'Sala',
  CLASS_CAPACITY: 'Capacidade Máxima',
  CLASS_VALUE: 'Valor Mensal (R$)',
  CLASS_ENROLLMENT_FEE: 'Taxa de Matrícula (R$)',
  TEACHER: 'Professor',
  SPECIALTIES: 'Especialidades',
  COMMISSION_RATE: 'Taxa de Comissão (%)',
  PIX_KEY: 'Chave PIX',
  BANK_DATA: 'Dados Bancários',
  BANK_NAME: 'Banco',
  BANK_AGENCY: 'Agência',
  BANK_ACCOUNT: 'Conta',
  ACCOUNT_TYPE: 'Tipo de Conta',
  STATUS: 'Status',
  OBSERVATIONS: 'Observações',
  ACTIVE: 'Ativo',
  START_DATE: 'Data de Início',
  END_DATE: 'Data de Término',
} as const;