import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManageSubscriptionRequest {
  subscription_id: string;
  action: 'pause' | 'cancel' | 'reactivate';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { subscription_id, action }: ManageSubscriptionRequest = await req.json()

    // Buscar a assinatura e verificar se pertence ao usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, enrollments(student_id)')
      .eq('id', subscription_id)
      .single()

    if (subError || !subscription) {
      throw new Error('Subscription not found')
    }

    // Verificar se a assinatura pertence ao usuário
    if (subscription.enrollments.student_id !== user.id) {
      throw new Error('Unauthorized - subscription does not belong to user')
    }

    // Configurações da API Asaas
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3'

    let asaasResponse
    let updateData: any = {}

    switch (action) {
      case 'pause':
        // Pausar assinatura no Asaas
        asaasResponse = await fetch(
          `${asaasBaseUrl}/subscriptions/${subscription.asaas_subscription_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasApiKey!,
            },
            body: JSON.stringify({
              status: 'INACTIVE'
            })
          }
        )

        if (!asaasResponse.ok) {
          const error = await asaasResponse.json()
          console.error('Asaas pause error:', error)
          throw new Error('Failed to pause subscription in Asaas')
        }

        updateData = {
          status: 'paused',
          paused_at: new Date().toISOString()
        }
        break

      case 'cancel':
        // Cancelar assinatura no Asaas
        asaasResponse = await fetch(
          `${asaasBaseUrl}/subscriptions/${subscription.asaas_subscription_id}`,
          {
            method: 'DELETE',
            headers: {
              'access_token': asaasApiKey!,
            }
          }
        )

        if (!asaasResponse.ok) {
          const error = await asaasResponse.json()
          console.error('Asaas cancel error:', error)
          throw new Error('Failed to cancel subscription in Asaas')
        }

        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }

        // Também desativar a matrícula
        await supabaseAdmin
          .from('enrollments')
          .update({ ativa: false })
          .eq('id', subscription.enrollment_id)

        break

      case 'reactivate':
        // Reativar assinatura no Asaas
        asaasResponse = await fetch(
          `${asaasBaseUrl}/subscriptions/${subscription.asaas_subscription_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasApiKey!,
            },
            body: JSON.stringify({
              status: 'ACTIVE'
            })
          }
        )

        if (!asaasResponse.ok) {
          const error = await asaasResponse.json()
          console.error('Asaas reactivate error:', error)
          throw new Error('Failed to reactivate subscription in Asaas')
        }

        updateData = {
          status: 'active',
          reactivated_at: new Date().toISOString(),
          paused_at: null
        }

        // Reativar a matrícula
        await supabaseAdmin
          .from('enrollments')
          .update({ ativa: true })
          .eq('id', subscription.enrollment_id)

        break

      default:
        throw new Error('Invalid action')
    }

    // Atualizar status no banco local
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update subscription in database')
    }

    // Log da ação para auditoria
    console.log(`Subscription ${subscription_id} - Action: ${action} - User: ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        action,
        subscription_id,
        message: `Assinatura ${action === 'pause' ? 'pausada' : action === 'cancel' ? 'cancelada' : 'reativada'} com sucesso`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar ação na assinatura'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    )
  }
})