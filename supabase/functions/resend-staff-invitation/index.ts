import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInvitationRequest {
  staffId: string;
  email: string;
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

    const { staffId, email }: ResendInvitationRequest = await req.json();

    console.log('Resending invitation for:', email);

    // Get user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', staffId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('Reset link error:', resetError);
      throw resetError;
    }

    // Update profile with new confirmation sent timestamp
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        email_confirmation_sent_at: new Date().toISOString(),
      })
      .eq('id', staffId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Espaço Vila Dança <noreply@espacoviladanca.com>",
      to: [email],
      subject: "Lembrete: Acesse o sistema - Espaço Vila Dança",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Lembrete de Acesso</h1>
          
          <p>Olá, <strong>${profile.nome_completo}</strong>!</p>
          
          <p>Este é um lembrete para que você acesse o sistema do Espaço Vila Dança.</p>
          
          <p>Você foi cadastrado(a) como <strong>${profile.role === 'admin' ? 'Administrador' : profile.role === 'professor' ? 'Professor' : 'Funcionário'}</strong> em nosso sistema.</p>
          
          <p>Para acessar ou redefinir sua senha, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetData.properties?.action_link}" 
               style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Sistema
            </a>
          </div>
          
          <p><strong>Seu email de acesso:</strong> ${email}</p>
          
          <p>Se você tiver alguma dúvida, entre em contato com a administração.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            Este é um email automático do sistema de gestão do Espaço Vila Dança.
          </p>
        </div>
      `,
    });

    console.log('Reminder email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lembrete enviado com sucesso',
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
    console.error("Error in resend-staff-invitation function:", error);
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