// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'professor',
  STUDENT: 'aluno',
  STAFF: 'funcionario',
} as const;

// Auth status
export const AUTH_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Enrollment status
export const ENROLLMENT_STATUS = {
  ACTIVE: 'ativa',
  INACTIVE: 'inativa',
  CANCELLED: 'cancelada',
  SUSPENDED: 'suspensa',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pendente',
  PAID: 'pago',
  OVERDUE: 'vencido',
  CANCELLED: 'cancelado',
} as const;

// Class levels
export const CLASS_LEVELS = {
  BEGINNER: 'iniciante',
  BASIC: 'basico',
  INTERMEDIATE: 'intermediario',
  ADVANCED: 'avancado',
} as const;

// Class types
export const CLASS_TYPES = {
  REGULAR: 'regular',
  INTENSIVE: 'intensivo',
  WORKSHOP: 'workshop',
} as const;

// Days of the week
export const WEEK_DAYS = {
  MONDAY: 'segunda',
  TUESDAY: 'terca',
  WEDNESDAY: 'quarta',
  THURSDAY: 'quinta',
  FRIDAY: 'sexta',
  SATURDAY: 'sabado',
  SUNDAY: 'domingo',
} as const;

// Account types
export const ACCOUNT_TYPES = {
  CHECKING: 'corrente',
  SAVINGS: 'poupanca',
} as const;

// Status colors for badges
export const STATUS_COLORS = {
  [AUTH_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [AUTH_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [AUTH_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  
  [ENROLLMENT_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [ENROLLMENT_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800',
  [ENROLLMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [ENROLLMENT_STATUS.SUSPENDED]: 'bg-orange-100 text-orange-800',
  
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUS.OVERDUE]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
} as const;

// Status labels for display
export const STATUS_LABELS = {
  [AUTH_STATUS.PENDING]: 'Pendente',
  [AUTH_STATUS.APPROVED]: 'Aprovado',
  [AUTH_STATUS.REJECTED]: 'Rejeitado',
  
  [ENROLLMENT_STATUS.ACTIVE]: 'Ativa',
  [ENROLLMENT_STATUS.INACTIVE]: 'Inativa',
  [ENROLLMENT_STATUS.CANCELLED]: 'Cancelada',
  [ENROLLMENT_STATUS.SUSPENDED]: 'Suspensa',
  
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.PAID]: 'Pago',
  [PAYMENT_STATUS.OVERDUE]: 'Vencido',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
  
  [CLASS_LEVELS.BEGINNER]: 'Iniciante',
  [CLASS_LEVELS.BASIC]: 'Básico',
  [CLASS_LEVELS.INTERMEDIATE]: 'Intermediário',
  [CLASS_LEVELS.ADVANCED]: 'Avançado',
  
  [CLASS_TYPES.REGULAR]: 'Regular',
  [CLASS_TYPES.INTENSIVE]: 'Intensivo',
  [CLASS_TYPES.WORKSHOP]: 'Workshop',
  
  [WEEK_DAYS.MONDAY]: 'Segunda-feira',
  [WEEK_DAYS.TUESDAY]: 'Terça-feira',
  [WEEK_DAYS.WEDNESDAY]: 'Quarta-feira',
  [WEEK_DAYS.THURSDAY]: 'Quinta-feira',
  [WEEK_DAYS.FRIDAY]: 'Sexta-feira',
  [WEEK_DAYS.SATURDAY]: 'Sábado',
  [WEEK_DAYS.SUNDAY]: 'Domingo',
  
  [ACCOUNT_TYPES.CHECKING]: 'Conta Corrente',
  [ACCOUNT_TYPES.SAVINGS]: 'Poupança',
} as const;

// Common options for selects
export const CLASS_LEVEL_OPTIONS = [
  { value: CLASS_LEVELS.BEGINNER, label: STATUS_LABELS[CLASS_LEVELS.BEGINNER] },
  { value: CLASS_LEVELS.BASIC, label: STATUS_LABELS[CLASS_LEVELS.BASIC] },
  { value: CLASS_LEVELS.INTERMEDIATE, label: STATUS_LABELS[CLASS_LEVELS.INTERMEDIATE] },
  { value: CLASS_LEVELS.ADVANCED, label: STATUS_LABELS[CLASS_LEVELS.ADVANCED] },
];

export const CLASS_TYPE_OPTIONS = [
  { value: CLASS_TYPES.REGULAR, label: STATUS_LABELS[CLASS_TYPES.REGULAR] },
  { value: CLASS_TYPES.INTENSIVE, label: STATUS_LABELS[CLASS_TYPES.INTENSIVE] },
  { value: CLASS_TYPES.WORKSHOP, label: STATUS_LABELS[CLASS_TYPES.WORKSHOP] },
];

export const WEEK_DAY_OPTIONS = [
  { value: WEEK_DAYS.MONDAY, label: STATUS_LABELS[WEEK_DAYS.MONDAY] },
  { value: WEEK_DAYS.TUESDAY, label: STATUS_LABELS[WEEK_DAYS.TUESDAY] },
  { value: WEEK_DAYS.WEDNESDAY, label: STATUS_LABELS[WEEK_DAYS.WEDNESDAY] },
  { value: WEEK_DAYS.THURSDAY, label: STATUS_LABELS[WEEK_DAYS.THURSDAY] },
  { value: WEEK_DAYS.FRIDAY, label: STATUS_LABELS[WEEK_DAYS.FRIDAY] },
  { value: WEEK_DAYS.SATURDAY, label: STATUS_LABELS[WEEK_DAYS.SATURDAY] },
  { value: WEEK_DAYS.SUNDAY, label: STATUS_LABELS[WEEK_DAYS.SUNDAY] },
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: ACCOUNT_TYPES.CHECKING, label: STATUS_LABELS[ACCOUNT_TYPES.CHECKING] },
  { value: ACCOUNT_TYPES.SAVINGS, label: STATUS_LABELS[ACCOUNT_TYPES.SAVINGS] },
];