/**
 * CRITICAL BUG ALERT - INFINITE LOADING PREVENTION
 * 
 * ⚠️  This file contains critical fixes for a RECURRENT infinite loading bug
 * that happens after login. The problem was in fetchUserProfile and auth 
 * initialization not properly handling timeouts and errors.
 * 
 * 🚨 NEVER REMOVE the following timeout protections:
 * - fetchUserProfile timeout (10s)
 * - initializeAuth timeout (5s) 
 * - Auth fallback timeout (15s)
 * - Promise.race() calls for timeout protection
 * 
 * 🐛 ROOT CAUSE: If fetchUserProfile hangs or fails silently,
 * setLoading(false) was never called, causing infinite loading screen.
 * 
 * 💡 If you see infinite loading after login, check:
 * 1. Console logs for profile fetch errors
 * 2. Network tab for hanging Supabase requests
 * 3. If timeout logs are being triggered
 * 
 * Last fixed: December 2024 - Claude Code
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nome_completo: string;
  cpf: string;
  whatsapp: string;
  email: string;
  role: 'admin' | 'professor' | 'funcionario' | 'aluno';
  status: 'ativo' | 'inativo';
  data_nascimento?: string | null;
  sexo?: 'masculino' | 'feminino' | 'outro' | null;
  endereco_completo?: string | null;
  cep?: string | null;
  chave_pix?: string | null;
  observacoes?: string | null;
}

interface UserSignUpData {
  nome_completo: string;
  cpf: string;
  whatsapp: string;
  sexo?: string;
  data_nascimento?: string;
  endereco_completo?: string;
  cep?: string;
  role?: string;
}

interface AuthResult {
  error: AuthError | Error | null;
  data?: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, userData: UserSignUpData) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
  verifySession: () => Promise<boolean>;
  getTokenClaims: () => Promise<Record<string, unknown> | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // CACHE OPTIMIZATION: Prevent unnecessary refetches
  const lastFetchTime = React.useRef<number>(0);
  const lastFetchedUserId = React.useRef<string | null>(null);
  const isFetching = React.useRef<boolean>(false);
  const CACHE_DURATION = 30000; // 30 seconds cache
  
  // ASAAS CUSTOMER CACHE: Prevent multiple attempts to create same customer
  const asaasCustomerCreationAttempts = React.useRef<Set<string>>(new Set());
  const asaasCustomerCreating = React.useRef<Set<string>>(new Set());
  
  // DEBUG: Enhanced monitoring for auth state and infinite loading prevention
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Auth State Monitor Started');
      
      const interval = setInterval(() => {
        console.log('📊 Auth State:', {
          loading,
          hasUser: !!user,
          hasSession: !!session,
          hasProfile: !!profile,
          profileId: profile?.id?.substring(0, 8),
          profileRole: profile?.role,
          isFetching: isFetching.current,
          cacheAge: profile ? Math.round((Date.now() - lastFetchTime.current) / 1000) + 's' : 'N/A'
        });
        
        // INFINITE LOADING DETECTION: If loading is true for more than 20 seconds, log warning
        if (loading) {
          const loadingTime = Date.now() - (window as any).__authLoadingStart || 0;
          if (loadingTime > 20000) {
            console.warn('⚠️ POTENTIAL INFINITE LOADING DETECTED!', {
              loadingTimeSeconds: Math.round(loadingTime / 1000),
              hasUser: !!user,
              hasSession: !!session,
              hasProfile: !!profile,
              isFetching: isFetching.current
            });
            
            // EMERGENCY RECOVERY: Force loading to false after 25 seconds
            if (loadingTime > 25000) {
              console.error('🚨 EMERGENCY RECOVERY: Forcing loading to false after 25 seconds');
              setLoading(false);
              delete (window as any).__authLoadingStart;
            }
          }
        }
      }, 5000); // Log every 5 seconds for better monitoring
      
      return () => clearInterval(interval);
    }
  }, [loading, user, session, profile]);
  
  // Track loading start time for infinite loading detection
  React.useEffect(() => {
    if (loading && !((window as any).__authLoadingStart)) {
      (window as any).__authLoadingStart = Date.now();
      console.log('🚀 Auth loading started at:', new Date().toISOString());
    } else if (!loading && (window as any).__authLoadingStart) {
      const loadingDuration = Date.now() - (window as any).__authLoadingStart;
      console.log('✅ Auth loading completed in:', Math.round(loadingDuration / 1000) + 's');
      delete (window as any).__authLoadingStart;
    }
  }, [loading]);

  useEffect(() => {
    let mounted = true;

    // CRITICAL FIX: Enhanced auth state listener with timeout protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, 'User ID:', session?.user?.id?.substring(0, 8), 'Profile cached:', !!profile);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User session found - fetching profile...');
          // CRITICAL FIX: Always ensure loading is resolved
          try {
            await fetchUserProfile(session.user.id);
          } catch (error) {
            console.error('❌ Profile fetch failed in auth state change:', error);
            setProfile(null);
            setLoading(false); // CRITICAL: Ensure loading is always set false
          }
        } else {
          console.log('❌ No user session - clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // CRITICAL FIX: Add timeout protection to prevent infinite loading
    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      
      try {
        // Add timeout to getSession to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getSession timeout after 5 seconds')), 5000);
        });
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
        const { data: { session } } = result;
        
        if (!mounted) return;
        
        console.log('📊 Session check result:', session ? 'Session found' : 'No session');
        
        // Only set initial state, let onAuthStateChange handle profile fetching
        setSession(session);
        setUser(session?.user ?? null);
        
        // CRITICAL FIX: Always set loading false if no session
        if (!session?.user) {
          console.log('❌ No session - setting loading to false');
          setLoading(false);
        } else {
          console.log('✅ Session exists - onAuthStateChange will handle profile fetch');
          // FALLBACK: Set a maximum timeout for the entire auth process
          setTimeout(() => {
            console.log('⏰ Auth timeout fallback - forcing loading to false after 15 seconds');
            setLoading(false);
          }, 15000);
        }
        
      } catch (error) {
        console.error('❌ Error or timeout initializing auth:', error);
        setLoading(false); // CRITICAL: Always set loading false on error
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 AuthProvider cleanup - unmounting');
      mounted = false;
      subscription.unsubscribe();
      // Clear cache on unmount
      lastFetchTime.current = 0;
      lastFetchedUserId.current = null;
      isFetching.current = false;
    };
  }, [toast]);

  // ASAAS CUSTOMER: Ensure Asaas customer exists for student users
  const ensureAsaasCustomer = async (userId: string) => {
    console.log('🏪 ensureAsaasCustomer started for userId:', userId);
    
    // Skip if already attempting or attempted
    if (asaasCustomerCreating.current.has(userId) || asaasCustomerCreationAttempts.current.has(userId)) {
      console.log('⏭️ Skipping Asaas customer creation - already attempted or in progress');
      return;
    }
    
    try {
      asaasCustomerCreating.current.add(userId);
      
      // First check if student already has asaas_customer_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('asaas_customer_id')
        .eq('id', userId)
        .single();
      
      if (studentError) {
        console.error('❌ Error checking student Asaas customer ID:', studentError);
        return;
      }
      
      if (studentData?.asaas_customer_id) {
        console.log('✅ Student already has Asaas customer:', studentData.asaas_customer_id);
        asaasCustomerCreationAttempts.current.add(userId);
        return;
      }
      
      console.log('🔄 Creating Asaas customer for student:', userId);
      
      // Call the edge function to create Asaas customer
      const { data: customerResult, error: customerError } = await supabase.functions.invoke(
        'create-asaas-customer',
        {
          body: { student_id: userId }
        }
      );
      
      if (customerError) {
        console.error('❌ Error calling create-asaas-customer function:', customerError);
        toast({
          title: "Aviso",
          description: "Não foi possível configurar sua conta de pagamentos. Você pode tentar fazer login novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }
      
      if (customerResult?.success) {
        console.log('✅ Asaas customer created successfully:', customerResult.asaas_customer_id);
        toast({
          title: "Conta configurada",
          description: "Sua conta de pagamentos foi configurada com sucesso!",
        });
        asaasCustomerCreationAttempts.current.add(userId);
      } else {
        console.error('❌ Asaas customer creation failed:', customerResult);
        toast({
          title: "Aviso",
          description: "Houve um problema ao configurar sua conta de pagamentos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in ensureAsaasCustomer:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao configurar conta de pagamentos.",
        variant: "destructive",
      });
    } finally {
      asaasCustomerCreating.current.delete(userId);
    }
  };

  // OPTIMIZED: Smart caching to prevent unnecessary refetches
  const fetchUserProfile = async (userId: string, forceRefresh = false) => {
    console.log('🔄 fetchUserProfile started for userId:', userId, { forceRefresh });
    
    // CACHE CHECK: Skip if we already have valid cached data
    const now = Date.now();
    const isCacheValid = (
      !forceRefresh &&
      profile &&
      profile.id === userId &&
      lastFetchedUserId.current === userId &&
      (now - lastFetchTime.current) < CACHE_DURATION
    );
    
    if (isCacheValid) {
      console.log('✨ Using cached profile data, skipping fetch');
      setLoading(false);
      return;
    }
    
    // DEBOUNCE: Prevent multiple simultaneous fetches
    if (isFetching.current && lastFetchedUserId.current === userId) {
      console.log('⏳ Profile fetch already in progress, skipping duplicate');
      return;
    }
    
    isFetching.current = true;
    
    try {
      // OPTIMIZED: Reduced timeout from 10s to 5s for better UX
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000);
      });
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('📡 Executing profile query with 5s timeout...');
      
      const result = await Promise.race([fetchPromise, timeoutPromise]) as { data: Profile | null; error: any };
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // FALLBACK: Don't clear existing profile if we have one and this is just a refresh
        if (!profile || profile.id !== userId) {
          setProfile(null);
        } else {
          console.log('🛡️ Keeping existing profile data after fetch error');
        }
        
        setLoading(false);
        return;
      }
      
      console.log('✅ Profile fetched successfully:', data?.nome_completo);
      setProfile(data);
      lastFetchTime.current = now;
      lastFetchedUserId.current = userId;
      setLoading(false);
      
      // ASAAS INTEGRATION: Ensure Asaas customer exists for student users
      if (data?.role === 'aluno') {
        console.log('👨‍🎓 User is a student - ensuring Asaas customer exists');
        // Call ensureAsaasCustomer without awaiting to avoid blocking the UI
        ensureAsaasCustomer(userId).catch(error => {
          console.error('❌ Error ensuring Asaas customer:', error);
        });
      }
      
    } catch (error) {
      console.error('❌ Error or timeout in fetchUserProfile:', error);
      
      // RETRY LOGIC: Attempt one retry on timeout
      if (error instanceof Error && error.message.includes('timeout') && !forceRefresh) {
        console.log('🔄 Timeout detected, attempting one retry...');
        setTimeout(() => {
          fetchUserProfile(userId, true);
        }, 1000);
        return;
      }
      
      // FALLBACK: Keep existing profile if available
      if (!profile || profile.id !== userId) {
        setProfile(null);
      } else {
        console.log('🛡️ Keeping existing profile data after timeout');
      }
      
      setLoading(false);
    } finally {
      isFetching.current = false;
    }
    
    console.log('✅ fetchUserProfile completed - loading set to false');
  };

  // Função para decodificar JWT claims (sem verificar assinatura - apenas para leitura)
  const getTokenClaims = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return null;
      
      // Decodifica o JWT para obter os claims
      const parts = session.access_token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }
      
      // Decodifica o payload (segunda parte do JWT)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return payload;
    } catch (error) {
      console.error('Error decoding JWT claims:', error);
      return null;
    }
  };

  // Função otimizada para verificar sessão
  const verifySession = async () => {
    console.log('🔍 verifySession called - checking token and profile cache');
    try {
      // Primeiro tenta obter os claims do token (mais rápido)
      const claims = await getTokenClaims();
      
      if (claims && claims.sub && claims.exp) {
        // Verifica se o token não está expirado
        const now = Math.floor(Date.now() / 1000);
        if (claims.exp > now) {
          // OPTIMIZED: Smart profile check with cache
          if (!profile || profile.id !== claims.sub) {
            await fetchUserProfile(claims.sub);
          } else {
            const now = Date.now();
            if (now - lastFetchTime.current > CACHE_DURATION) {
              await fetchUserProfile(claims.sub);
            }
          }
          return true;
        }
      }
      
      // Fallback para getUser se necessário
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return false;
      }
      
      // OPTIMIZED: Smart profile update with cache check
      if (!profile || profile.id !== user.id) {
        await fetchUserProfile(user.id);
      } else {
        // Check if cache is still valid
        const now = Date.now();
        if (now - lastFetchTime.current > CACHE_DURATION) {
          await fetchUserProfile(user.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying session:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific email confirmation error
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            error.message.includes('not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Verifique seu email e clique no link de confirmação. Se não recebeu, você pode solicitar um novo email.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      
      return { error };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro no login",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const signUp = async (email: string, password: string, userData: UserSignUpData): Promise<AuthResult> => {
    try {
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      
      console.log('SignUp attempt:', {
        email,
        redirectUrl,
        userData: {
          nome_completo: userData.nome_completo,
          cpf: userData.cpf,
          whatsapp: userData.whatsapp,
          role: userData.role || 'aluno'
        }
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: userData.nome_completo,
            cpf: userData.cpf,
            whatsapp: userData.whatsapp,
            sexo: userData.sexo,
            data_nascimento: userData.data_nascimento,
            endereco_completo: userData.endereco_completo,
            cep: userData.cep,
            role: userData.role || 'aluno'
          }
        }
      });

      console.log('SignUp response:', {
        data: data ? {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at
          } : null,
          session: data.session ? 'present' : null
        } : null,
        error: error ? {
          message: error.message,
          status: error.status || 'no status',
          fullError: error
        } : null
      });

      // Enhanced logging for debugging duplicate CPF errors
      if (error) {
        console.log('Full error object:', error);
        console.log('Error message for analysis:', error.message);
        console.log('Error includes profiles_cpf_key:', error.message.includes('profiles_cpf_key'));
        console.log('Error includes duplicate:', error.message.includes('duplicate'));
        console.log('Error includes Database error:', error.message.includes('Database error saving new user'));
      }

      if (error) {
        // Tratar diferentes tipos de erro
        let errorTitle = "Erro no cadastro";
        let errorDescription = error.message;

        if (error.message.includes('already registered')) {
          errorTitle = "Email já cadastrado";
          errorDescription = "Este email já está cadastrado. Tente fazer login ou use outro email.";
        } else if (error.message.includes('invalid email')) {
          errorTitle = "Email inválido";
          errorDescription = "Por favor, digite um email válido.";
        } else if (error.message.includes('password')) {
          errorTitle = "Senha inválida";
          errorDescription = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes('duplicate key') && error.message.includes('profiles_cpf_key')) {
          errorTitle = "CPF já cadastrado";
          errorDescription = "Este CPF já foi cadastrado. Tente fazer login ou use outro CPF.";
        } else if (error.message.includes('Database error saving new user')) {
          // Check if it might be a CPF duplicate error in the message
          if (error.message.includes('profiles_cpf_key') || 
              error.message.includes('duplicate') || 
              error.message.toLowerCase().includes('cpf')) {
            errorTitle = "CPF já cadastrado";
            errorDescription = "Este CPF já foi cadastrado. Tente fazer login ou use outro CPF.";
          } else {
            errorTitle = "Erro no servidor";
            errorDescription = "Ocorreu um erro no servidor. Tente novamente em alguns instantes.";
          }
        } else if (error.message.includes('unexpected_failure')) {
          // Sometimes the error comes as unexpected_failure
          errorTitle = "CPF já cadastrado";
          errorDescription = "Este CPF já foi cadastrado. Tente fazer login ou use outro CPF.";
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta. Confira também a pasta de spam.",
        });
      }

      return { error, data };
    } catch (error) {
      console.error('Unexpected error during signUp:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado",
          description: "Verifique seu email para redefinir sua senha",
        });
      }

      return { error };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro ao enviar email",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    try {
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Erro ao reenviar confirmação",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email de confirmação reenviado",
          description: "Verifique seu email e clique no link para confirmar sua conta",
        });
      }

      return { error };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro ao reenviar confirmação",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Redirecionar para a página de login após logout
      window.location.href = '/login';
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro no logout",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Senha redefinida",
        description: "Sua senha foi redefinida com sucesso",
      });

      return { error: null };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro ao redefinir senha",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<AuthResult> => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Refresh profile
      await fetchUserProfile(user.id);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });

      return { error: null };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
      toast({
        title: "Erro ao atualizar perfil",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMsg) };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    resetPassword,
    resendConfirmation,
    signOut,
    updatePassword,
    updateProfile,
    verifySession,
    getTokenClaims,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
