import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email_confirmed_at);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
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
    try {
      // Primeiro tenta obter os claims do token (mais rápido)
      const claims = await getTokenClaims();
      
      if (claims && claims.sub && claims.exp) {
        // Verifica se o token não está expirado
        const now = Math.floor(Date.now() / 1000);
        if (claims.exp > now) {
          // Token válido, verifica se temos o perfil carregado
          if (!profile || profile.id !== claims.sub) {
            await fetchUserProfile(claims.sub);
          }
          return true;
        }
      }
      
      // Fallback para getUser se necessário
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return false;
      }
      
      // Atualiza perfil se necessário
      if (!profile || profile.id !== user.id) {
        await fetchUserProfile(user.id);
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
          status: error.status || 'no status'
        } : null
      });

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
      window.location.href = '/auth';
      
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
