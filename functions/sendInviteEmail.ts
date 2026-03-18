import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

const ROLE_MAPPING = {
  coach: 'student',
  nutritionist: 'client',
  clinician: 'patient',
};

const ROLE_LABELS = {
  student: 'aluno',
  client: 'cliente',
  patient: 'paciente',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { recipient_email, recipient_name, invited_by_role } = await req.json();

    // Validate input
    if (!recipient_email || !recipient_name || !invited_by_role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role matches
    if (user.atlas_role !== invited_by_role) {
      return Response.json({ error: 'Role mismatch' }, { status: 403 });
    }

    // Generate invite code
    const invite_code = uuidv4();
    const recipient_role = ROLE_MAPPING[invited_by_role];

    // Create invite record
    const invite = await base44.asServiceRole.entities.Invite.create({
      invited_by_email: user.email,
      invited_by_role,
      recipient_email,
      recipient_name,
      recipient_role,
      invite_code,
      sent_at: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    // Get app URL from environment or use window location
    const appUrl = Deno.env.get('APP_URL') || 'https://atlascore.app';
    const inviteLink = `${appUrl}/auth?mode=signup&invite_code=${invite_code}`;

    // Send email
    const emailRes = await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `${user.full_name} te convidou para o Atlas Core`,
      body: `
Olá ${recipient_name}!

${user.full_name} te convidou para se juntar ao Atlas Core como ${ROLE_LABELS[recipient_role]}.

🔗 Link de convite: ${inviteLink}

Este convite expira em 30 dias.

Qualquer dúvida, responda este email ou visite nosso suporte.

Bem-vindo ao Atlas Core! 💪
      `.trim(),
      from_name: 'Atlas Core',
    });

    console.log(`sendInviteEmail: Created invite ${invite.id} for ${recipient_email} from ${user.email}`);

    return Response.json({
      success: true,
      invite_id: invite.id,
      invite_code,
      message: `Convite enviado para ${recipient_email}`,
    });
  } catch (error) {
    console.error('sendInviteEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});