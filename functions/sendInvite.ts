import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const INVITE_EXPIRY_DAYS = 30;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { recipient_email, recipient_name, inviter_email, inviter_name, role, inviter_role } = body;

    // Validate inputs
    if (!recipient_email || !recipient_name || !inviter_email || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados incompletos' }),
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);

    // Verify inviter is authenticated and has correct role
    const inviter = await base44.auth.me();
    if (!inviter || inviter.email !== inviter_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 403 }
      );
    }

    // Map role to entity and fields
    const roleMap = {
      student: { entity: 'CoachStudent', inviterField: 'coach_email', recipientField: 'student_email', recipientNameField: 'student_name' },
      client: { entity: 'NutritionistClientLink', inviterField: 'nutritionist_email', recipientField: 'client_email', recipientNameField: 'client_name' },
      patient: { entity: 'ClinicianPatient', inviterField: 'clinician_email', recipientField: 'patient_email', recipientNameField: 'patient_name' },
    };

    const mapping = roleMap[role];
    if (!mapping) {
      return new Response(
        JSON.stringify({ success: false, error: 'Role inválido' }),
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
    const expiryDateStr = expiresAt.toISOString().split('T')[0];

    // Create link record
    const linkData = {
      [mapping.inviterField]: inviter_email,
      [mapping.recipientField]: recipient_email,
      [mapping.recipientNameField]: recipient_name,
      status: 'pending',
      invited_at: new Date().toISOString().split('T')[0],
      expires_at: expiryDateStr,
    };

    await base44.asServiceRole.entities[mapping.entity].create(linkData);

    // Send email with invite link
    const appUrl = Deno.env.get('APP_URL') || 'https://atlas-core.app';
    const inviteUrl = `${appUrl}/auth?mode=signup&invite=${encodeURIComponent(recipient_email)}&role=${role}&inviter=${encodeURIComponent(inviter_email)}`;

    const emailBody = `
Olá ${recipient_name},

${inviter_name} te convidou para fazer parte da sua equipe no Atlas Core!

Se você é um(a) ${role === 'student' ? 'aluno(a)' : role === 'client' ? 'cliente' : 'paciente'}, clique no link abaixo para criar sua conta:

${inviteUrl}

Este link expira em 30 dias.

Não foi você? Ignore este email.

---
Atlas Core
`.trim();

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `${inviter_name} te convidou para Atlas Core`,
      body: emailBody,
      from_name: 'Atlas Core',
    });

    console.log(`Invite sent to ${recipient_email} from ${inviter_email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Convite enviado com sucesso' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('sendInvite error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});