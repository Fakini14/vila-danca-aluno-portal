// supabase/functions/asaas-subscription-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription: string;
    value: number;
    netValue: number;
    dueDate: string;
    status: string;
    description: string;
    externalReference: string;
    billingType: string;
    invoiceUrl: string;
    bankSlipUrl?: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: AsaasWebhookPayload = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('Webhook received:', payload.event, payload.payment?.id)

    if (!payload.payment) {
      console.log('No payment data in webhook, ignoring')
      return new Response('OK', { status: 200 })
    }

    switch (payload.event) {
      case 'PAYMENT_CREATED': {
        console.log('Processing PAYMENT_CREATED for:', payload.payment.id)
        
        // Nova cobrança criada - salvar no banco
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('asaas_subscription_id', payload.payment.subscription)
          .single()

        if (subscription) {
          const { error } = await supabase
            .from('subscription_payments')
            .upsert({
              subscription_id: subscription.id,
              asaas_payment_id: payload.payment.id,
              amount: payload.payment.value,
              due_date: payload.payment.dueDate,
              status: payload.payment.status,
              payment_method: payload.payment.billingType,
              invoice_url: payload.payment.invoiceUrl,
              bank_slip_url: payload.payment.bankSlipUrl,
              pix_qr_code: payload.payment.pixQrCode,
            }, { onConflict: 'asaas_payment_id' })

          if (error) {
            console.error('Error saving payment:', error)
          } else {
            console.log('Payment saved successfully')
          }
        } else {
          console.error('Subscription not found for:', payload.payment.subscription)
        }
        break;
      }

      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        console.log('Processing PAYMENT_RECEIVED/CONFIRMED for:', payload.payment.id)
        
        // Pagamento confirmado
        const { error: updateError } = await supabase
          .from('subscription_payments')
          .update({
            status: 'RECEIVED',
            paid_date: new Date().toISOString().split('T')[0],
          })
          .eq('asaas_payment_id', payload.payment.id)

        if (updateError) {
          console.error('Error updating payment status:', updateError)
        }

        // Buscar informações do pagamento e assinatura
        const { data: paymentData } = await supabase
          .from('subscription_payments')
          .select(`
            subscription_id,
            subscriptions (
              enrollment_id,
              student_id
            )
          `)
          .eq('asaas_payment_id', payload.payment.id)
          .single()

        if (paymentData && paymentData.subscriptions) {
          // Verificar se é o primeiro pagamento da assinatura
          const { count } = await supabase
            .from('subscription_payments')
            .select('*', { count: 'exact' })
            .eq('subscription_id', paymentData.subscription_id)
            .eq('status', 'RECEIVED')

          console.log('Payment count for subscription:', count)

          if (count === 1) {
            // É o primeiro pagamento - ativar matrícula
            const { error: enrollmentError } = await supabase
              .from('enrollments')
              .update({ ativa: true })
              .eq('id', paymentData.subscriptions.enrollment_id)

            if (enrollmentError) {
              console.error('Error activating enrollment:', enrollmentError)
            } else {
              console.log('Enrollment activated successfully')
            }

            // Atualizar status da assinatura para ativa
            await supabase
              .from('subscriptions')
              .update({ status: 'active' })
              .eq('id', paymentData.subscription_id)
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE': {
        console.log('Processing PAYMENT_OVERDUE for:', payload.payment.id)
        
        // Pagamento vencido
        await supabase
          .from('subscription_payments')
          .update({ status: 'OVERDUE' })
          .eq('asaas_payment_id', payload.payment.id)

        // Atualizar status da assinatura
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('asaas_subscription_id', payload.payment.subscription)
          .single()

        if (subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'overdue' })
            .eq('id', subscription.id)
        }
        break;
      }

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED': {
        console.log('Processing PAYMENT_DELETED/REFUNDED for:', payload.payment.id)
        
        // Pagamento cancelado ou reembolsado
        await supabase
          .from('subscription_payments')
          .update({ status: payload.event.replace('PAYMENT_', '') })
          .eq('asaas_payment_id', payload.payment.id)
        break;
      }

      default:
        console.log('Unhandled webhook event:', payload.event)
        break;
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    // Sempre retornar 200 para evitar retry desnecessário do ASAAS
    return new Response('OK', { status: 200 })
  }
})