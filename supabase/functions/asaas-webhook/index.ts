import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook token
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    const receivedToken = req.headers.get('asaas-access-token')
    
    if (webhookToken && receivedToken !== webhookToken) {
      console.error('Invalid webhook token')
      return new Response('Unauthorized', { status: 401 })
    }

    const webhookData = await req.json()
    console.log('Received webhook:', JSON.stringify(webhookData, null, 2))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { event, payment } = webhookData

    if (!payment || !payment.id) {
      console.error('Invalid webhook payload: missing payment data')
      return new Response('Bad Request', { status: 400 })
    }

    console.log(`Processing ${event} for payment ${payment.id}`)

    // Find payment in our database using Asaas payment ID
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (paymentError) {
      console.error('Payment not found in database:', paymentError)
      return new Response('Payment not found', { status: 404 })
    }

    console.log('Found payment record:', paymentRecord.id)

    // Update payment status based on webhook event
    let newStatus = paymentRecord.status
    let paidDate = paymentRecord.paid_date
    let paymentMethod = paymentRecord.payment_method

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        newStatus = 'pago'
        paidDate = payment.paymentDate || new Date().toISOString()
        paymentMethod = payment.billingType?.toLowerCase() || 'unknown'
        break
      
      case 'PAYMENT_OVERDUE':
        newStatus = 'vencido'
        break
      
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        newStatus = 'cancelado'
        break
      
      case 'PAYMENT_RESTORED':
        newStatus = 'pendente'
        break
        
      default:
        console.log(`Unhandled event type: ${event}`)
        break
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        paid_date: paidDate,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)

    if (updateError) {
      console.error('Failed to update payment:', updateError)
      throw new Error('Failed to update payment record')
    }

    console.log(`Payment ${paymentRecord.id} updated to status: ${newStatus}`)

    // If payment was confirmed, activate related enrollments
    if (newStatus === 'pago') {
      console.log('Payment confirmed, activating enrollments...')

      // Get related enrollments for this student and enrollment period
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', paymentRecord.student_id)
        .eq('ativa', false) // Only inactive enrollments
        .gte('created_at', paymentRecord.created_at) // Created around the same time

      if (enrollmentError) {
        console.error('Failed to fetch enrollments:', enrollmentError)
      } else if (enrollments && enrollments.length > 0) {
        console.log(`Found ${enrollments.length} enrollments to activate`)

        // Activate all related enrollments
        const { error: activateError } = await supabase
          .from('enrollments')
          .update({ 
            ativa: true,
            updated_at: new Date().toISOString()
          })
          .in('id', enrollments.map(e => e.id))

        if (activateError) {
          console.error('Failed to activate enrollments:', activateError)
        } else {
          console.log(`Successfully activated ${enrollments.length} enrollments`)
        }

        // Send confirmation email (optional)
        try {
          await supabase.functions.invoke('send-enrollment-confirmation', {
            body: {
              student_id: paymentRecord.student_id,
              payment_id: paymentRecord.id,
              enrollment_ids: enrollments.map(e => e.id)
            }
          })
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the webhook for email issues
        }
      }
    }

    // Log webhook event for audit trail
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          event_type: event,
          asaas_payment_id: payment.id,
          payment_id: paymentRecord.id,
          payload: webhookData,
          processed_at: new Date().toISOString(),
          status: 'success'
        })
    } catch (logError) {
      console.error('Failed to log webhook event:', logError)
      // Don't fail the webhook for logging issues
    }

    console.log('Webhook processed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentRecord.id,
        new_status: newStatus,
        event_processed: event
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in asaas-webhook:', error)

    // Log failed webhook for debugging
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      await supabase
        .from('webhook_logs')
        .insert({
          event_type: 'WEBHOOK_ERROR',
          payload: { error: error.message, stack: error.stack },
          processed_at: new Date().toISOString(),
          status: 'error'
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
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