# Migração para JWT Signing Keys Assimétricos do Supabase

## Visão Geral

Este documento detalha o plano de migração do sistema de autenticação do Vila Dança & Arte para usar os novos JWT Signing Keys assimétricos do Supabase. Esta atualização traz melhorias significativas em segurança e performance.

## Status da Migração

- **Início**: 05/08/2025
- **Status**: Em Planejamento
- **Prazo Estimado**: 3-4 dias

## Por que Migrar?

### Problemas com Chaves Simétricas (Atual)
- Requer chamada para `getUser()` para verificar tokens
- Cria dependência do servidor de autenticação
- Gerenciamento manual de secrets aumenta riscos de segurança
- Performance limitada pela latência de rede

### Benefícios das Chaves Assimétricas (Nova)
- ✅ Verificação local de tokens sem dependência do servidor
- ✅ Rotação segura de chaves sem downtime
- ✅ Performance melhorada com Web Crypto API
- ✅ Compatibilidade com padrões RSA e Elliptic Curves
- ✅ Descoberta automática de chaves públicas

## Cronograma de Implementação

### Fase 1: Preparação (Dia 1)
- [ ] Acessar dashboard do Supabase
- [ ] Migrar JWT secret existente
- [ ] Gerar par de chaves assimétricas
- [ ] Documentar chaves e configurações

### Fase 2: Implementação (Dias 2-3)
- [ ] Atualizar cliente Supabase
- [ ] Implementar método `getClaims()`
- [ ] Atualizar hook de autenticação
- [ ] Modificar páginas de autenticação
- [ ] Implementar cache de chaves públicas

### Fase 3: Testes (Dia 3)
- [ ] Testar fluxo de registro
- [ ] Testar fluxo de login/logout
- [ ] Testar confirmação de email
- [ ] Testar renovação de tokens
- [ ] Validar rotação de chaves

### Fase 4: Deploy e Monitoramento (Dia 4)
- [ ] Deploy em produção
- [ ] Monitorar logs de autenticação
- [ ] Validar métricas de performance
- [ ] Documentar processo

## Mudanças Técnicas Detalhadas

### 1. Configuração do Dashboard Supabase

```
1. Navegar para: Project Settings > JWT Signing Keys
2. Clicar em "Migrate JWT secret"
3. Gerar novo par de chaves (RSA256 por padrão)
4. Anotar:
   - Public Key ID
   - Algorithm (RS256)
   - Status (standby → active)
```

### 2. Atualização do Cliente Supabase

**Arquivo**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://eqhouenplcddjtqapurn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_..."; // Nova chave publicável

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Novas configurações para JWT assimétrico
    jwt: {
      verify: true, // Habilita verificação local
      decode: true  // Habilita decodificação local
    }
  }
});
```

### 3. Implementação do getClaims()

**Arquivo**: `src/hooks/useAuth.tsx`

```typescript
// Adicionar nova função para obter claims do JWT
const getClaims = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;
    
    // Usar getClaims() para verificação rápida
    const { data, error } = await supabase.auth.getClaims(session.access_token);
    
    if (error) {
      console.error('Error getting claims:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getClaims:', error);
    return null;
  }
};

// Otimizar verificações de autenticação
const verifySession = async () => {
  // Primeiro tentar getClaims (mais rápido)
  const claims = await getClaims();
  
  if (claims && claims.sub) {
    // Token válido, buscar perfil se necessário
    if (!profile || profile.id !== claims.sub) {
      await fetchUserProfile(claims.sub);
    }
    return true;
  }
  
  // Fallback para getUser se necessário
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};
```

### 4. Descoberta de Chaves Públicas (JWKS)

**Arquivo**: `src/utils/auth/jwks.ts`

```typescript
interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n?: string;
  e?: string;
}

interface JWKS {
  keys: JWK[];
}

class JWKSCache {
  private cache: Map<string, JWKS> = new Map();
  private ttl = 3600000; // 1 hora
  
  async getKeys(projectUrl: string): Promise<JWKS> {
    const cacheKey = `${projectUrl}/auth/v1/.well-known/jwks.json`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.timestamp + this.ttl > Date.now()) {
      return cached.jwks;
    }
    
    try {
      const response = await fetch(cacheKey);
      const jwks = await response.json();
      
      this.cache.set(cacheKey, {
        jwks,
        timestamp: Date.now()
      });
      
      return jwks;
    } catch (error) {
      console.error('Error fetching JWKS:', error);
      throw error;
    }
  }
  
  clearCache() {
    this.cache.clear();
  }
}

export const jwksCache = new JWKSCache();
```

### 5. Atualização da Página de Confirmação

**Arquivo**: `src/pages/auth/Confirm.tsx`

```typescript
// Substituir getSession por verificação mais eficiente
const verifyEmailConfirmation = async () => {
  try {
    // Primeiro tentar getClaims para verificação rápida
    const claims = await supabase.auth.getClaims();
    
    if (claims && claims.email_verified) {
      // Email confirmado com sucesso
      return { success: true, userId: claims.sub };
    }
    
    // Fallback para método tradicional se necessário
    const { data: { session } } = await supabase.auth.getSession();
    return { 
      success: session?.user?.email_confirmed_at ? true : false,
      userId: session?.user?.id 
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { success: false };
  }
};
```

## Configuração de Variáveis de Ambiente

```env
# Antigas (serão descontinuadas)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Novas (obrigatórias)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_SECRET_KEY=sb_secret_... # Apenas para edge functions
```

## Processo de Rotação de Chaves

### Rotação Sem Downtime

1. **Criar nova chave standby**
   - Gerar novo par de chaves no dashboard
   - Status: standby (não está assinando JWTs ainda)

2. **Aguardar propagação (20 minutos)**
   - Chaves são propagadas para todos os edges
   - Cache local atualizado automaticamente

3. **Ativar nova chave**
   - Promover chave de standby para active
   - Antiga chave continua válida temporariamente

4. **Revogar chave antiga**
   - Após validar que tudo funciona
   - Marcar chave antiga como revoked

5. **Deletar chave antiga (opcional)**
   - Após período de segurança
   - Ação irreversível

## Checklist de Validação

### Testes Funcionais
- [ ] Registro de novo usuário
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Confirmação de email
- [ ] Reset de senha
- [ ] Logout
- [ ] Renovação automática de token
- [ ] Expiração de sessão

### Testes de Performance
- [ ] Tempo de verificação de token < 50ms
- [ ] Cache de chaves funcionando
- [ ] Sem chamadas desnecessárias ao servidor

### Testes de Segurança
- [ ] Tokens inválidos são rejeitados
- [ ] Tokens expirados são rejeitados
- [ ] Rotação de chaves sem interrupção

## Rollback Plan

Em caso de problemas:

1. **Reverter para chave simétrica**
   - Manter JWT secret original como backup
   - Reverter cliente para usar chave antiga
   - Desativar verificação assimétrica

2. **Passos de rollback**
   ```bash
   # 1. Reverter código
   git checkout <commit-antes-migracao>
   
   # 2. Reverter chaves no dashboard
   # Marcar chave assimétrica como revoked
   # Reativar JWT secret simétrico
   
   # 3. Limpar cache
   # Forçar limpeza de cache nos clientes
   ```

## Monitoramento Pós-Deploy

### Métricas a Acompanhar
- Taxa de erro de autenticação
- Latência de verificação de token
- Número de renovações de token
- Falhas de confirmação de email

### Logs Importantes
```typescript
// Adicionar logs para debugging
console.log('[Auth] Token verification method:', method);
console.log('[Auth] Verification time:', endTime - startTime);
console.log('[Auth] Cache hit:', cacheHit);
```

## Recursos e Referências

- [Blog Supabase: JWT Signing Keys](https://supabase.com/blog/jwt-signing-keys)
- [Documentação: JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)
- [GitHub Discussion](https://github.com/orgs/supabase/discussions/29289)
- [Guia de Migração Oficial](https://supabase.com/docs/guides/auth/jwts)

## Suporte e Contato

Em caso de dúvidas durante a migração:
- Supabase Support: support@supabase.io
- Community Discord: discord.supabase.com
- GitHub Issues: github.com/supabase/supabase

---

**Última atualização**: 05/08/2025
**Responsável**: Equipe de Desenvolvimento Vila Dança & Arte