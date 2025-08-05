/**
 * JWKS (JSON Web Key Set) utilities for JWT verification
 * Provides caching and automatic discovery of public keys from Supabase
 */

interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
}

interface JWKS {
  keys: JWK[];
}

interface CachedJWKS {
  jwks: JWKS;
  timestamp: number;
}

class JWKSCache {
  private cache: Map<string, CachedJWKS> = new Map();
  private ttl = 600000; // 10 minutos (alinhado com cache do Supabase Edge)
  
  /**
   * Obtém as chaves públicas do endpoint JWKS
   * Com cache automático para melhor performance
   */
  async getKeys(projectUrl: string): Promise<JWKS> {
    const jwksUrl = `${projectUrl}/auth/v1/.well-known/jwks.json`;
    const cached = this.cache.get(jwksUrl);
    
    // Retorna do cache se ainda válido
    if (cached && cached.timestamp + this.ttl > Date.now()) {
      console.log('[JWKS] Returning cached keys');
      return cached.jwks;
    }
    
    try {
      console.log('[JWKS] Fetching keys from:', jwksUrl);
      const response = await fetch(jwksUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
      }
      
      const jwks: JWKS = await response.json();
      
      // Validar estrutura básica
      if (!jwks.keys || !Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS format');
      }
      
      // Armazenar no cache
      this.cache.set(jwksUrl, {
        jwks,
        timestamp: Date.now()
      });
      
      console.log(`[JWKS] Successfully cached ${jwks.keys.length} keys`);
      return jwks;
    } catch (error) {
      console.error('[JWKS] Error fetching keys:', error);
      
      // Se houver cache expirado, usar como fallback
      if (cached) {
        console.warn('[JWKS] Using expired cache as fallback');
        return cached.jwks;
      }
      
      throw error;
    }
  }
  
  /**
   * Encontra uma chave específica pelo kid (key id)
   */
  async getKey(projectUrl: string, kid: string): Promise<JWK | null> {
    const jwks = await this.getKeys(projectUrl);
    return jwks.keys.find(key => key.kid === kid) || null;
  }
  
  /**
   * Limpa o cache (útil para forçar atualização)
   */
  clearCache() {
    console.log('[JWKS] Cache cleared');
    this.cache.clear();
  }
  
  /**
   * Remove entradas expiradas do cache
   */
  pruneCache() {
    const now = Date.now();
    let pruned = 0;
    
    for (const [url, cached] of this.cache.entries()) {
      if (cached.timestamp + this.ttl < now) {
        this.cache.delete(url);
        pruned++;
      }
    }
    
    if (pruned > 0) {
      console.log(`[JWKS] Pruned ${pruned} expired entries`);
    }
  }
}

// Instância singleton do cache
export const jwksCache = new JWKSCache();

// Limpar cache periodicamente (a cada 30 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    jwksCache.pruneCache();
  }, 1800000);
}

/**
 * Extrai o project URL do Supabase URL
 */
export function getProjectUrl(): string {
  // Obtém do cliente Supabase configurado
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                      'https://eqhouenplcddjtqapurn.supabase.co';
  return supabaseUrl;
}

/**
 * Decodifica o header de um JWT
 */
export function decodeJWTHeader(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const header = JSON.parse(
      atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))
    );
    
    return header;
  } catch (error) {
    console.error('Error decoding JWT header:', error);
    return null;
  }
}

/**
 * Verifica se o JWT está usando algoritmo assimétrico
 */
export function isAsymmetricJWT(token: string): boolean {
  const header = decodeJWTHeader(token);
  if (!header) return false;
  
  // Algoritmos assimétricos suportados pelo Supabase
  const asymmetricAlgorithms = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
  return asymmetricAlgorithms.includes(header.alg);
}

/**
 * Obtém o kid (key id) do JWT
 */
export function getJWTKeyId(token: string): string | null {
  const header = decodeJWTHeader(token);
  return header?.kid || null;
}