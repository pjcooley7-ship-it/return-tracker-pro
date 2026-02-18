function structuredLog(severity: string, message: string, data?: Record<string, unknown>) {
  const entry = JSON.stringify({
    severity,
    function: "track-shipment",
    message,
    timestamp: new Date().toISOString(),
    ...data,
  });
  if (severity === "ERROR") console.error(entry);
  else console.log(entry);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TRACKINGMORE_API_URL = 'https://api.trackingmore.com/v4';

// Carrier code mapping for TrackingMore
const carrierMapping: Record<string, string> = {
  'ups': 'ups',
  'fedex': 'fedex',
  'usps': 'usps',
  'dhl': 'dhl',
  'dhl-express': 'dhl',
  'amazon': 'amazon-fba-us',
  'ontrac': 'ontrac',
  'lasership': 'lasership',
  'canada-post': 'canada-post',
  'purolator': 'purolator',
  'royal-mail': 'royal-mail',
};

// Map TrackingMore status to our tracking_status enum
function mapStatus(trackingmoreStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pre_transit',
    'notfound': 'unknown',
    'transit': 'in_transit',
    'pickup': 'in_transit',
    'undelivered': 'exception',
    'delivered': 'delivered',
    'expired': 'unknown',
    'alert': 'exception',
  };
  return statusMap[trackingmoreStatus.toLowerCase()] || 'unknown';
}

// Type for the join result of tracking + returns
interface TrackingWithReturn {
  id: string;
  return_id: string;
  tracking_number: string;
  carrier: string;
  status: string;
  last_location: string | null;
  estimated_delivery: string | null;
  last_update: string | null;
  tracking_history: unknown;
  created_at: string;
  updated_at: string;
  returns: { user_id: string };
}

interface TrackingMoreEvent {
  Date: string;
  StatusDescription: string;
  Details: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Lazy import to speed up cold start
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");

    const TRACKINGMORE_API_KEY = Deno.env.get('TRACKINGMORE_API_KEY');
    if (!TRACKINGMORE_API_KEY) {
      throw new Error('TRACKINGMORE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user-scoped client using anon key + user's JWT (respects RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;
    const { action, return_id, tracking_number, carrier } = await req.json();

    if (action === 'create') {
      // Create a new tracking entry
      if (!return_id || !tracking_number || !carrier) {
        return new Response(JSON.stringify({ error: 'Missing required fields: return_id, tracking_number, carrier' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify return belongs to user (RLS enforces this, but explicit check for clarity)
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .select('id')
        .eq('id', return_id)
        .eq('user_id', user.id)
        .single();

      if (returnError || !returnData) {
        return new Response(JSON.stringify({ error: 'Return not found or unauthorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const carrierCode = carrierMapping[carrier.toLowerCase()] || carrier.toLowerCase();

      // Create tracking in TrackingMore
      structuredLog("INFO", "Creating tracking in TrackingMore", { tracking_number, carrier: carrierCode });

      const createResponse = await fetch(`${TRACKINGMORE_API_URL}/trackings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Tracking-Api-Key': TRACKINGMORE_API_KEY,
        },
        body: JSON.stringify({
          tracking_number,
          courier_code: carrierCode,
        }),
      });

      const createResult = await createResponse.json();
      structuredLog("INFO", "TrackingMore create response", { code: createResult.meta?.code });

      // Even if tracking already exists, we proceed (code 4016)
      if (createResult.meta?.code !== 200 && createResult.meta?.code !== 4016) {
        structuredLog("ERROR", "TrackingMore API error", { result: createResult });
        // Still create local tracking record
      }

      // Insert tracking record in our database
      const { data: trackingData, error: trackingError } = await supabase
        .from('tracking')
        .insert({
          return_id,
          tracking_number,
          carrier: carrier.toUpperCase(),
          status: 'pre_transit',
          tracking_history: [],
        })
        .select()
        .single();

      if (trackingError) {
        structuredLog("ERROR", "Database insert error", { error: String(trackingError) });
        return new Response(JSON.stringify({ error: 'Failed to create tracking record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update return status to indicate tracking added
      await supabase
        .from('returns')
        .update({ status: 'label_created' })
        .eq('id', return_id)
        .eq('status', 'initiated');

      return new Response(JSON.stringify({ success: true, tracking: trackingData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'refresh') {
      // Refresh tracking info
      if (!tracking_number) {
        return new Response(JSON.stringify({ error: 'Missing tracking_number' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get current tracking record with joined return (for ownership verification)
      const { data: trackingRecord, error: fetchError } = await supabase
        .from('tracking')
        .select('*, returns!inner(user_id)')
        .eq('tracking_number', tracking_number)
        .single();

      if (fetchError || !trackingRecord) {
        return new Response(JSON.stringify({ error: 'Tracking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Type the join result properly
      const typedRecord = trackingRecord as unknown as TrackingWithReturn;

      // Verify ownership
      if (typedRecord.returns.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const carrierCode = carrierMapping[typedRecord.carrier.toLowerCase()] || typedRecord.carrier.toLowerCase();

      // Fetch latest tracking from TrackingMore
      structuredLog("INFO", "Fetching tracking from TrackingMore", { tracking_number, carrier: carrierCode });

      const trackResponse = await fetch(
        `${TRACKINGMORE_API_URL}/trackings/${carrierCode}/${tracking_number}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Tracking-Api-Key': TRACKINGMORE_API_KEY,
          },
        }
      );

      const trackResult = await trackResponse.json();
      structuredLog("INFO", "TrackingMore response", { code: trackResult.meta?.code });

      if (trackResult.meta?.code !== 200) {
        structuredLog("ERROR", "TrackingMore fetch error", { result: trackResult });
        return new Response(JSON.stringify({
          success: false,
          error: trackResult.meta?.message || 'Failed to fetch tracking info',
          tracking: trackingRecord
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const trackingInfo = trackResult.data;
      const newStatus = mapStatus(trackingInfo.delivery_status || 'unknown');

      // Build tracking history
      const trackingHistory = (trackingInfo.origin_info?.trackinfo || []).map((event: TrackingMoreEvent) => ({
        timestamp: event.Date,
        status: event.StatusDescription,
        location: event.Details,
        description: event.StatusDescription,
      }));

      // Update tracking record
      const { data: updatedTracking, error: updateError } = await supabase
        .from('tracking')
        .update({
          status: newStatus,
          last_location: trackingInfo.latest_checkpoint_message || null,
          estimated_delivery: trackingInfo.scheduled_delivery_date || null,
          last_update: new Date().toISOString(),
          tracking_history: trackingHistory,
        })
        .eq('id', typedRecord.id)
        .select()
        .single();

      if (updateError) {
        structuredLog("ERROR", "Failed to update tracking", { error: String(updateError) });
      }

      // If delivered, update return status
      if (newStatus === 'delivered') {
        await supabase
          .from('returns')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('id', typedRecord.return_id);
      } else if (newStatus === 'in_transit') {
        await supabase
          .from('returns')
          .update({ status: 'in_transit' })
          .eq('id', typedRecord.return_id)
          .in('status', ['initiated', 'label_created']);
      }

      return new Response(JSON.stringify({ success: true, tracking: updatedTracking }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    structuredLog("ERROR", "Unhandled error", { error: String(error) });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
