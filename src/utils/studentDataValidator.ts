/**
 * Utilitário para validação robusta de dados de estudantes
 * 
 * Responsável por:
 * - Validar campos obrigatórios para criação de cliente Asaas
 * - Sanitizar e normalizar dados
 * - Validar formatos específicos (CPF, telefone, email)
 * - Fornecer mensagens de erro descritivas
 */

// Tipos
export interface StudentValidationData {
  id: string;
  asaas_customer_id?: string;
  profiles: {
    nome_completo: string;
    email: string;
    cpf: string;
    whatsapp?: string;
  };
  endereco_completo?: string;
  cep?: string;
  whatsapp?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  sanitizedData: Partial<StudentValidationData> | null;
}

export interface AsaasCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  mobilePhone: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

// Constantes
const REQUIRED_FIELDS = ['nome_completo', 'email', 'cpf', 'phone'] as const;
const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[6-9]\d{3}[-\s]?\d{4}$/;

/**
 * Valida todos os dados necessários para criar cliente Asaas
 */
export function validateStudentForAsaas(student: StudentValidationData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  try {
    // 1. Validar nome completo
    const nameValidation = validateFullName(student.profiles?.nome_completo);
    if (!nameValidation.valid) {
      errors.push({
        field: 'nome_completo',
        code: 'INVALID_NAME',
        message: nameValidation.error || 'Nome inválido',
        severity: 'error'
      });
    }

    // 2. Validar email
    const emailValidation = validateEmail(student.profiles?.email);
    if (!emailValidation.valid) {
      errors.push({
        field: 'email',
        code: 'INVALID_EMAIL',
        message: emailValidation.error || 'Email inválido',
        severity: 'error'
      });
    }

    // 3. Validar CPF
    const cpfValidation = validateCPF(student.profiles?.cpf);
    if (!cpfValidation.valid) {
      errors.push({
        field: 'cpf',
        code: 'INVALID_CPF',
        message: cpfValidation.error || 'CPF inválido',
        severity: 'error'
      });
    }

    // 4. Validar telefone (múltiplas fontes)
    const phone = getPreferredPhone(student);
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      errors.push({
        field: 'phone',
        code: 'INVALID_PHONE',
        message: phoneValidation.error || 'Telefone inválido',
        severity: 'error'
      });
    }

    // 5. Validações opcionais (warnings)
    if (student.endereco_completo && student.endereco_completo.length < 10) {
      warnings.push({
        field: 'endereco_completo',
        code: 'SHORT_ADDRESS',
        message: 'Endereço muito curto',
        severity: 'warning'
      });
    }

    if (student.cep && !validateCEP(student.cep).valid) {
      warnings.push({
        field: 'cep',
        code: 'INVALID_CEP',
        message: 'CEP com formato inválido',
        severity: 'warning'
      });
    }

    // Criar dados sanitizados se válido
    let sanitizedData: Partial<StudentValidationData> | null = null;
    if (errors.length === 0) {
      sanitizedData = {
        id: student.id,
        asaas_customer_id: student.asaas_customer_id,
        profiles: {
          nome_completo: sanitizeName(student.profiles.nome_completo),
          email: sanitizeEmail(student.profiles.email),
          cpf: sanitizeCPF(student.profiles.cpf),
          whatsapp: sanitizePhone(phone),
        },
        endereco_completo: student.endereco_completo?.trim(),
        cep: student.cep ? sanitizeCEP(student.cep) : undefined,
        whatsapp: sanitizePhone(phone),
      };
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      valid: false,
      errors: [{
        field: 'general',
        code: 'VALIDATION_ERROR',
        message: `Erro na validação: ${errorMessage}`,
        severity: 'error'
      }],
      warnings: [],
      sanitizedData: null
    };
  }
}

/**
 * Converte dados validados para payload do Asaas
 */
export function convertToAsaasPayload(student: StudentValidationData): AsaasCustomerPayload {
  const phone = getPreferredPhone(student);
  
  return {
    name: sanitizeName(student.profiles.nome_completo),
    email: sanitizeEmail(student.profiles.email),
    cpfCnpj: sanitizeCPF(student.profiles.cpf),
    phone: sanitizePhone(phone),
    mobilePhone: sanitizePhone(phone),
    address: student.endereco_completo || 'Não informado',
    addressNumber: 'S/N',
    complement: '',
    province: 'Centro',
    city: 'Não informado',
    state: 'SP',
    postalCode: student.cep ? sanitizeCEP(student.cep) : '00000000'
  };
}

// Validadores específicos
function validateFullName(name?: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Nome muito curto' };
  }
  
  const words = trimmed.split(/\s+/);
  if (words.length < 2) {
    return { valid: false, error: 'Nome e sobrenome são obrigatórios' };
  }
  
  if (words.some(word => word.length < 1)) {
    return { valid: false, error: 'Nome contém palavras inválidas' };
  }
  
  return { valid: true };
}

function validateEmail(email?: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }
  
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Formato de email inválido' };
  }
  
  return { valid: true };
}

function validateCPF(cpf?: string): { valid: boolean; error?: string } {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, error: 'CPF é obrigatório' };
  }
  
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check length
  if (cleanCPF.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  // Check for repeated digits (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, error: 'CPF com dígitos repetidos é inválido' };
  }
  
  // Calculate verification digits
  if (!isValidCPFChecksum(cleanCPF)) {
    return { valid: false, error: 'CPF com dígitos verificadores inválidos' };
  }
  
  return { valid: true };
}

function validatePhone(phone?: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Telefone é obrigatório' };
  }
  
  // Remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Brazilian phone: should have 10 or 11 digits
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  // Area code validation (11-99)
  const areaCode = cleanPhone.substring(0, 2);
  if (parseInt(areaCode) < 11 || parseInt(areaCode) > 99) {
    return { valid: false, error: 'Código de área inválido' };
  }
  
  return { valid: true };
}

function validateCEP(cep?: string): { valid: boolean; error?: string } {
  if (!cep) {
    return { valid: true }; // CEP is optional
  }
  
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) {
    return { valid: false, error: 'CEP deve ter 8 dígitos' };
  }
  
  return { valid: true };
}

// Sanitizadores
function sanitizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function sanitizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  
  // Add country code if missing
  if (clean.length === 11 && clean.startsWith('1')) {
    return clean; // Already has area code
  } else if (clean.length === 10) {
    return clean; // 10 digits is valid
  } else if (clean.length === 11) {
    return clean; // 11 digits with mobile 9
  }
  
  return clean;
}

function sanitizeCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

// Utilitários
function getPreferredPhone(student: StudentValidationData): string {
  return student.profiles?.whatsapp || 
         student.whatsapp || 
         '';
}

function isValidCPFChecksum(cpf: string): boolean {
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Gera mensagem de erro amigável para o usuário
 */
export function getErrorMessage(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  const errorMessages = errors.map(error => {
    switch (error.code) {
      case 'INVALID_NAME':
        return 'Nome completo (nome e sobrenome) é obrigatório';
      case 'INVALID_EMAIL':
        return 'Email válido é obrigatório';
      case 'INVALID_CPF':
        return 'CPF válido é obrigatório';
      case 'INVALID_PHONE':
        return 'Telefone válido é obrigatório';
      default:
        return error.message;
    }
  });
  
  return errorMessages.join('; ');
}

/**
 * Gera lista de campos que precisam ser corrigidos
 */
export function getMissingFields(errors: ValidationError[]): string[] {
  const fieldMap: Record<string, string> = {
    nome_completo: 'Nome completo',
    email: 'Email',
    cpf: 'CPF',
    phone: 'Telefone/WhatsApp'
  };
  
  return errors
    .filter(error => error.severity === 'error')
    .map(error => fieldMap[error.field] || error.field);
}