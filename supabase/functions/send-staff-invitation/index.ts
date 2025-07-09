import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StaffInvitationRequest {
  email: string;
  nome_completo: string;
  cpf: string;
  whatsapp: string;
  role: 'admin' | 'professor' | 'funcionario';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { email, nome_completo, cpf, whatsapp, role }: StaffInvitationRequest = await req.json();

    console.log('Creating staff invitation for:', email);

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Create the auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        nome_completo,
        cpf,
        whatsapp,
        role,
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData.user?.id);

    // Create staff entry if role is not 'aluno'
    if (role !== 'aluno') {
      const { error: staffError } = await supabaseClient
        .from('staff')
        .insert({
          id: authData.user!.id,
          funcao: role,
        });

      if (staffError) {
        console.error('Staff error:', staffError);
        throw staffError;
      }
    }

    // Update profile with email confirmation details
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        email_confirmed: false,
        email_confirmation_sent_at: new Date().toISOString(),
      })
      .eq('id', authData.user!.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // Send invitation email
    const resetLink = `https://b075fb91-6486-4cbb-8a13-f4cd3d022d90.lovableproject.com/auth?type=recovery&token=${authData.user!.email_confirmation_token}`;

    const emailResponse = await resend.emails.send({
      from: "Espaço Vila Dança <noreply@espacoviladanca.com>",
      to: [email],
      subject: "Convite para acessar o sistema - Espaço Vila Dança",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Bem-vindo ao Espaço Vila Dança!</h1>
          
          <p>Olá, <strong>${nome_completo}</strong>!</p>
          
          <p>Você foi convidado(a) para fazer parte da equipe do Espaço Vila Dança como <strong>${role === 'admin' ? 'Administrador' : role === 'professor' ? 'Professor' : 'Funcionário'}</strong>.</p>
          
          <p>Para acessar o sistema, clique no botão abaixo e defina sua senha:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Definir Senha e Acessar Sistema
            </a>
          </div>
          
          <p><strong>Dados do seu cadastro:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Função:</strong> ${role === 'admin' ? 'Administrador' : role === 'professor' ? 'Professor' : 'Funcionário'}</li>
          </ul>
          
          <p>Após definir sua senha, você poderá acessar todas as funcionalidades do sistema de gestão.</p>
          
          <p>Se você tiver alguma dúvida, entre em contato com a administração.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            Este é um email automático do sistema de gestão do Espaço Vila Dança.<br>
            Se você não solicitou este convite, pode ignorar este email.
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        emailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-staff-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);