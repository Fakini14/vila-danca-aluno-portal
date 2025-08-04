import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== ASAAS API TEST FUNCTION ===')
    
    // Get environment variables
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasWalletId = Deno.env.get('ASAAS_WALLET_ID')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    
    console.log('Environment check:', {
      hasApiKey: !!asaasApiKey,
      hasWalletId: !!asaasWalletId,
      environment: asaasEnvironment,
      apiKeyPrefix: asaasApiKey?.substring(0, 10) + '...',
      walletIdPrefix: asaasWalletId?.substring(0, 10) + '...'
    })
    
    if (!asaasApiKey || !asaasWalletId) {
      return new Response(JSON.stringify({ 
        error: 'Missing credentials',
        hasApiKey: !!asaasApiKey,
        hasWalletId: !!asaasWalletId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3'
    
    console.log('Testing API URL:', asaasBaseUrl)
    
    // Test 1: Simple API call - list customers
    console.log('=== TEST 1: List customers ===')
    const testUrl = `${asaasBaseUrl}/customers?limit=1`
    console.log('Request URL:', testUrl)
    
    const startTime = Date.now()
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'access_token': asaasApiKey,
          'Authorization': `Bearer ${asaasApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        }
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      let responseBody = ''
      let responseData = null
      
      try {
        responseBody = await response.text()
        responseData = JSON.parse(responseBody)
        console.log('Response body (parsed):', responseData)
      } catch (parseError) {
        console.log('Response body (raw):', responseBody.substring(0, 500))
        console.log('Parse error:', parseError.message)
      }
      
      return new Response(JSON.stringify({
        success: true,
        test: 'list_customers',
        api: {
          url: testUrl,
          environment: asaasEnvironment,
          responseTime: `${responseTime}ms`
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData || responseBody.substring(0, 500)
        }
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      return new Response(JSON.stringify({
        error: 'Fetch failed',
        details: fetchError.message,
        url: testUrl,
        environment: asaasEnvironment
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    
  } catch (error) {
    console.error('General error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})