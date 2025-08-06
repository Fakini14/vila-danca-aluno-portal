import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { student_id, payment_id, enrollment_ids } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        profiles(
          nome_completo,
          email,
          telefone,
          whatsapp
        )
      `)
      .eq('id', student_id)
      .single()

    if (studentError) throw studentError

    // Get payment data
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError) throw paymentError

    // Get enrollment data with classes
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        classes(
          nome,
          dias_semana,
          horario_inicio,
          horario_fim,
          valor_mensal,
          class_types(
            nome,
            color
          ),
          class_teachers(
            teacher_id,
            profiles:teacher_id(
              nome_completo
            )
          )
        )
      `)
      .in('id', enrollment_ids)

    if (enrollmentError) throw enrollmentError

    // Format class schedule information
    const formatDaysOfWeek = (days: string[]) => {
      const dayNames: Record<string, string> = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
      }
      return days.map(day => dayNames[day] || day).join(', ')
    }

    const formatTime = (time: string) => {
      return time.substring(0, 5)
    }

    // Generate email content
    const classesHtml = enrollments?.map(enrollment => `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 8px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${enrollment.classes.class_types?.color || '#6366f1'}; margin-right: 8px;"></div>
          <h3 style="margin: 0; font-weight: 600;">${enrollment.classes.nome}</h3>
        </div>
        <p style="margin: 4px 0; color: #64748b; font-size: 14px;">
          <strong>Modalidade:</strong> ${enrollment.classes.class_types?.nome || 'N/A'}
        </p>
        <p style="margin: 4px 0; color: #64748b; font-size: 14px;">
          <strong>Professor(a):</strong> ${enrollment.classes.class_teachers?.[0]?.profiles?.nome_completo || 'A definir'}
        </p>
        <p style="margin: 4px 0; color: #64748b; font-size: 14px;">
          <strong>Horário:</strong> ${formatDaysOfWeek(enrollment.classes.dias_semana)} - ${formatTime(enrollment.classes.horario_inicio)} às ${formatTime(enrollment.classes.horario_fim)}
        </p>
        <p style="margin: 4px 0; color: #64748b; font-size: 14px;">
          <strong>Valor mensal:</strong> R$ ${enrollment.classes.valor_mensal.toFixed(2)}
        </p>
      </div>
    `).join('') || ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Matrícula - Vila Dança & Arte</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Matrícula Confirmada!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Vila Dança & Arte</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; margin-top: 0;">
            Olá, <strong>${student.profiles.nome_completo}</strong>! 👋
          </p>
          
          <p>
            Sua matrícula foi <strong style="color: #10b981;">confirmada com sucesso</strong>! 
            Estamos muito felizes em ter você conosco na Vila Dança & Arte.
          </p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151;">💳 Detalhes do Pagamento</h3>
            <p style="margin: 4px 0;"><strong>Valor pago:</strong> R$ ${payment.amount.toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Descrição:</strong> ${payment.description}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Confirmado</span></p>
          </div>

          <h3 style="color: #374151; margin: 24px 0 16px 0;">🎭 Suas Turmas</h3>
          ${classesHtml}

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px 0; color: #1e40af;">📅 Próximos Passos</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Compareça às suas aulas nos horários indicados</li>
              <li style="margin: 8px 0;">Chegue 10 minutos antes do início da aula</li>
              <li style="margin: 8px 0;">Traga roupas confortáveis para a prática</li>
              <li style="margin: 8px 0;">Mantenha seus pagamentos em dia</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px 0; color: #d97706;">📍 Informações Importantes</h4>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Endereço:</strong> Rua da Dança, 123 - Centro<br>
              <strong>Telefone:</strong> (11) 99999-9999<br>
              <strong>WhatsApp:</strong> (11) 99999-9999<br>
              <strong>Email:</strong> contato@viladancaearte.com.br
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL')}/student/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Acessar Meu Portal
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">
            Em caso de dúvidas, entre em contato conosco.<br>
            Vila Dança & Arte - Realizando sonhos através da dança ✨
          </p>
        </div>
      </body>
      </html>
    `

    // Send email using your preferred email service
    // This is a placeholder - you'll need to implement your email service integration
    console.log('Email would be sent to:', student.profiles.email)
    console.log('Email content prepared successfully')

    // You can integrate with services like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - etc.

    // For now, just log success
    console.log('Enrollment confirmation email prepared for:', student.profiles.nome_completo)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Enrollment confirmation email prepared',
        recipient: student.profiles.email,
        enrollments_count: enrollments?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in send-enrollment-confirmation:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})