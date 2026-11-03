import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: Record<string, unknown> | null;
};
type Push = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  channelId: 'stc-reports' | 'stc-updates';
  data: Record<string, string>;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!isTrustedWebhook(request)) {
      return Response.json({ error: 'Unauthorized webhook.' }, { status: 401, headers: corsHeaders });
    }
    const payload = (await request.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || !payload.record) {
      return Response.json({ skipped: true }, { headers: corsHeaders });
    }

    let userIds: string[] = [];
    let notification: Omit<Push, 'to'> | null = null;
    const record = payload.record;

    if (payload.table === 'reports') {
      const residenceId = String(record.residence_id ?? '');
      const service = String(record.service ?? '');
      const [{ data: admins, error: adminsError }, { data: managers, error: managersError }] = await Promise.all([
        supabase.from('profiles').select('id').eq('residence_id', residenceId)
          .eq('role', 'staff').eq('role_status', 'active').eq('service', service),
        supabase.from('profiles').select('id').eq('residence_id', residenceId)
          .eq('role', 'manager').eq('role_status', 'active'),
      ]);
      if (adminsError) throw adminsError;
      if (managersError) throw managersError;
      userIds = [...(admins ?? []).map(profile => profile.id), ...(managers ?? []).map(profile => profile.id)];
      notification = {
        title: 'Nouveau signalement',
        body: `Un nouveau signalement a été envoyé au service ${service}.`,
        sound: 'default', channelId: 'stc-reports',
        data: { type: 'report_received', reportId: String(record.id ?? '') },
      };
    } else if (payload.table === 'report_messages') {
      const reportId = String(record.report_id ?? '');
      const senderId = String(record.sender_id ?? '');
      const [{ data: report, error: reportError }, { data: sender, error: senderError }] = await Promise.all([
        supabase.from('reports').select('id,student_id,residence_id').eq('id', reportId).maybeSingle(),
        supabase.from('profiles').select('role').eq('id', senderId).maybeSingle(),
      ]);
      if (reportError) throw reportError;
      if (senderError) throw senderError;
      if (!report || !sender || sender.role === 'student') return Response.json({ sent: 0 }, { headers: corsHeaders });

      const { data: managers, error: managersError } = await supabase.from('profiles').select('id')
        .eq('residence_id', report.residence_id).eq('role', 'manager').eq('role_status', 'active');
      if (managersError) throw managersError;
      userIds = [report.student_id, ...(managers ?? []).map(profile => profile.id)]
        .filter(userId => userId !== senderId);
      notification = {
        title: 'Réponse à votre signalement',
        body: 'Un responsable a répondu à votre demande. Touchez pour consulter la conversation.',
        sound: 'default', channelId: 'stc-reports',
        data: { type: 'report_response', reportId },
      };
    } else if (payload.table === 'app_releases' && record.is_major === true) {
      const { data: tokens, error } = await supabase.from('push_tokens').select('expo_push_token');
      if (error) throw error;
      const version = String(record.version ?? '');
      const messages = (tokens ?? []).map(token => ({
        to: token.expo_push_token,
        title: 'Nouvelle mise à jour STC Résidence',
        body: `${String(record.title ?? 'Une mise à jour importante est disponible')} · version ${version}`,
        sound: 'default' as const, channelId: 'stc-updates' as const,
        data: { type: 'major_update', releaseId: String(record.id ?? '') },
      }));
      return await deliver(messages);
    } else if (payload.table === 'residence_announcements') {
      const residenceId = String(record.residence_id ?? '');
      const senderId = String(record.sender_id ?? '');
      const selectedIds = Array.isArray(record.recipient_ids) ? record.recipient_ids.map(id => String(id)) : [];
      if (selectedIds.length) userIds = selectedIds;
      else {
        const { data: residents, error } = await supabase.from('profiles').select('id').eq('residence_id', residenceId);
        if (error) throw error;
        userIds = (residents ?? []).map(profile => profile.id);
      }
      userIds = userIds.filter(userId => userId !== senderId);
      notification = {
        title: 'Annonce de résidence',
        body: String(record.message ?? '').slice(0, 140),
        sound: 'default', channelId: 'stc-reports',
        data: { type: 'residence_announcement', announcementId: String(record.id ?? '') },
      };
    } else {
      return Response.json({ skipped: true }, { headers: corsHeaders });
    }

    if (!notification) return Response.json({ sent: 0 }, { headers: corsHeaders });
    const uniqueUserIds = [...new Set(userIds)];
    const { data: tokens, error } = await supabase.from('push_tokens').select('expo_push_token').in('user_id', uniqueUserIds);
    if (error) throw error;
    return await deliver((tokens ?? []).map(token => ({ to: token.expo_push_token, ...notification! })));
  } catch (error) {
    console.error('Push webhook failed:', error);
    return Response.json({ error: 'Unable to send push notification.' }, { status: 500, headers: corsHeaders });
  }
});

function isTrustedWebhook(request: Request): boolean {
  const receivedKey = request.headers.get('apikey');
  const keySet = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!receivedKey || !keySet) return false;
  try {
    const values = Object.values(JSON.parse(keySet) as Record<string, string>);
    return values.some(key => key === receivedKey);
  } catch {
    return false;
  }
}

async function deliver(messages: Push[]): Promise<Response> {
  if (messages.length === 0) return Response.json({ sent: 0 }, { headers: corsHeaders });
  let sent = 0;
  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(index, index + 100)),
    });
    if (!response.ok) throw new Error(`Expo Push Service returned ${response.status}.`);
    sent += Math.min(100, messages.length - index);
  }
  return Response.json({ sent }, { headers: corsHeaders });
}
