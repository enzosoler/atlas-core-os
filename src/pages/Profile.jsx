import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Save, Trash2, AlertTriangle, CreditCard, Camera, Loader2, Phone, Mail, Lock, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '@/lib/ThemeContext';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import ProfessionalLinks from '@/components/shared/ProfessionalLinks';
import AchievementsSection from '@/components/profile/AchievementsSection';

const ACTIVITY_LEVELS = [
  ['sedentary',   'Sedentary (no exercise)'],
  ['light',       'Light (1-3× / week)'],
  ['moderate',    'Moderate (3-5× / week)'],
  ['active',      'Active (6-7× / week)'],
  ['very_active', 'Very Active (2× / day)'],
];

const NUMS = ['age','height','current_weight','target_weight','body_fat_goal','calories_target','protein_target','carbs_target','fat_target','water_target'];

function FL({ children }) {
  return <label className="t-label block mb-1.5">{children}</label>;
}

export default function Profile() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { subscription } = useSubscription();
  const { t, language, setLanguage } = useTranslation();
  const avatarInputRef = useRef(null);

  const [form, setForm] = useState({
    phone: '',
    age: '', sex: 'male', height: '', current_weight: '', target_weight: '', body_fat_goal: '',
    activity_level: 'moderate', dietary_style: '', training_goal: '',
    calories_target: '', protein_target: '', carbs_target: '', fat_target: '', water_target: '2.5',
    theme_preference: 'light', ai_tone_preference: 'friendly',
    avatar_url: '',
  });
  const [profileId, setProfileId] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  // Auto-activate trial for new users
  useEffect(() => {
    if (user?.email && !subscription) {
      base44.functions.invoke('activateTrial', { user_email: user.email }).catch(() => {});
    }
  }, [user?.email, subscription]);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const l = await base44.entities.UserProfile.list(); return l?.[0] || null; },
  });

  useEffect(() => {
    if (profile) {
      setProfileId(profile.id);
      setForm(f => ({
        ...f,
        ...Object.fromEntries(
          Object.entries(profile)
            .filter(([k]) => k in f)
            .map(([k, v]) => [k, v != null ? String(v) : ''])
        ),
      }));
    }
  }, [profile]);

  const saveMut = useMutation({
    mutationFn: (data) =>
      profileId
        ? base44.entities.UserProfile.update(profileId, data)
        : base44.entities.UserProfile.create(data),
    onSuccess: (res) => {
      if (!profileId && res?.id) setProfileId(res.id);
      qc.invalidateQueries(['user-profile']);
      toast.success('Perfil salvo com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar. Tente novamente.'),
  });

  const f = (k) => form[k] ?? '';
  const setV = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const setI = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => {
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v == null) return;
      payload[k] = NUMS.includes(k) ? Number(v) : v;
    });
    saveMut.mutate(payload);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(p => ({ ...p, avatar_url: file_url }));
      // Save immediately
      const payload = {};
      Object.entries({ ...form, avatar_url: file_url }).forEach(([k, v]) => {
        if (v === '' || v == null) return;
        payload[k] = NUMS.includes(k) ? Number(v) : v;
      });
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, payload);
      } else {
        const res = await base44.entities.UserProfile.create(payload);
        if (res?.id) setProfileId(res.id);
      }
      qc.invalidateQueries(['user-profile']);
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Digite um e-mail válido');
      return;
    }
    setEmailSaving(true);
    try {
      await base44.auth.updateMe({ email: newEmail.trim() });
      toast.success('E-mail atualizado! Pode ser necessário fazer login novamente.');
      setShowEmailModal(false);
      setNewEmail('');
      qc.invalidateQueries(['me']);
    } catch (e) {
      toast.error(e?.message || 'Erro ao atualizar e-mail. Tente novamente.');
    } finally {
      setEmailSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    setPasswordSent(true);
    // Redirect to Base44 password reset flow via logout + login
    setTimeout(() => {
      base44.auth.logout('/auth?mode=login&reset=1');
    }, 1500);
  };

  const resetAllData = async () => {
    setResetting(true);
    const [meals, workouts, measurements, checkins, protocols, supplements, labExams, photos] = await Promise.all([
      base44.entities.Meal.list(),
      base44.entities.Workout.list(),
      base44.entities.Measurement.list(),
      base44.entities.DailyCheckin.list(),
      base44.entities.Protocol.list(),
      base44.entities.Supplement.list(),
      base44.entities.LabExam.list(),
      base44.entities.ProgressPhoto.list(),
    ]);
    await Promise.all([
      ...meals.map(r => base44.entities.Meal.delete(r.id)),
      ...workouts.map(r => base44.entities.Workout.delete(r.id)),
      ...measurements.map(r => base44.entities.Measurement.delete(r.id)),
      ...checkins.map(r => base44.entities.DailyCheckin.delete(r.id)),
      ...protocols.map(r => base44.entities.Protocol.delete(r.id)),
      ...supplements.map(r => base44.entities.Supplement.delete(r.id)),
      ...labExams.map(r => base44.entities.LabExam.delete(r.id)),
      ...photos.map(r => base44.entities.ProgressPhoto.delete(r.id)),
    ]);
    qc.invalidateQueries();
    setResetting(false);
    setShowReset(false);
    toast.success('Todos os dados foram apagados');
  };

  const avatarUrl = f('avatar_url');
  const initials = user?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex justify-end mb-4">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-2 py-1 text-[12px] rounded border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[hsl(var(--fg))]">
          <option value="pt-BR">PT</option>
          <option value="en-US">EN</option>
        </select>
      </div>

      {/* ── Avatar + Account info ── */}
      <div className="surface p-5 rounded-xl space-y-4">
        <p className="t-label">{language === 'en-US' ? 'Account' : 'Conta'}</p>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--brand)/0.1)] border-2 border-[hsl(var(--brand)/0.2)] flex items-center justify-center overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[22px] font-bold text-[hsl(var(--brand))]">{initials}</span>
              }
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--brand))] text-white flex items-center justify-center shadow-md hover:bg-[hsl(var(--brand)/0.85)] transition-colors"
            >
              {uploadingAvatar
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Camera className="w-3 h-3" strokeWidth={2.5} />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold truncate">{user?.full_name || (language === 'en-US' ? 'User' : 'Usuário')}</p>
            <p className="t-caption truncate">{user?.email}</p>
          </div>
        </div>

        {/* Email */}
        <div>
          <FL><span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {language === 'en-US' ? 'Email' : 'E-mail'}</span></FL>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[hsl(var(--border-h))] bg-[hsl(var(--shell))] text-[13px]">
            <span className="flex-1 text-[hsl(var(--fg-2))] truncate">{user?.email || '—'}</span>
            <button
              onClick={() => { setNewEmail(user?.email || ''); setShowEmailModal(true); }}
              className="flex items-center gap-1 text-[11px] text-[hsl(var(--brand))] font-medium hover:underline shrink-0"
            >
              <Pencil className="w-3 h-3" /> {language === 'en-US' ? 'Change' : 'Alterar'}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <FL><span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {language === 'en-US' ? 'Phone / WhatsApp' : 'Telefone / WhatsApp'}</span></FL>
          <Input
            type="tel"
            value={f('phone')}
            onChange={setI('phone')}
            placeholder="+55 11 99999-9999"
            className="h-10 rounded-lg text-[13px]"
          />
        </div>

        {/* Password */}
        <div>
          <FL><span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> {language === 'en-US' ? 'Password' : 'Senha'}</span></FL>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[hsl(var(--border-h))] bg-[hsl(var(--shell))] text-[13px]">
            <span className="flex-1 text-[hsl(var(--fg-2))]">••••••••</span>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1 text-[11px] text-[hsl(var(--brand))] font-medium hover:underline shrink-0"
            >
              <Pencil className="w-3 h-3" /> {language === 'en-US' ? 'Change' : 'Alterar'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Profile tabs ── */}
      <Tabs defaultValue="biometrics">
        <TabsList className="bg-[hsl(var(--card-hi))] border border-[hsl(var(--border))] h-10 rounded-xl w-full p-1 gap-1">
          {(language === 'en-US'
            ? [['biometrics','Biometrics'], ['targets','Targets'], ['preferences','Preferences']]
            : [['biometrics','Biometria'], ['targets','Metas'], ['preferences','Preferências']]
          ).map(([v, l]) => (
            <TabsTrigger key={v} value={v}
              className="flex-1 rounded-lg text-[12px] font-medium h-8 transition-all data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:text-[hsl(var(--fg))] data-[state=active]:shadow-sm text-[hsl(var(--fg-2))]">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="biometrics" className="mt-4">
          <div className="surface rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FL>{language === 'en-US' ? 'Age' : 'Idade'}</FL>
                <Input type="number" value={f('age')} onChange={setI('age')} placeholder="30" className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FL>{language === 'en-US' ? 'Height (cm)' : 'Altura (cm)'}</FL>
                <Input type="number" value={f('height')} onChange={setI('height')} placeholder="175" className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FL>{language === 'en-US' ? 'Current Weight (kg)' : 'Peso atual (kg)'}</FL>
                <Input type="number" step="0.1" value={f('current_weight')} onChange={setI('current_weight')} placeholder="80" className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FL>{language === 'en-US' ? 'Sex' : 'Sexo'}</FL>
                <Select value={f('sex')} onValueChange={setV('sex')}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{language === 'en-US' ? 'Male' : 'Masculino'}</SelectItem>
                    <SelectItem value="female">{language === 'en-US' ? 'Female' : 'Feminino'}</SelectItem>
                    <SelectItem value="other">{language === 'en-US' ? 'Other' : 'Outro'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <FL>{language === 'en-US' ? 'Activity Level' : 'Nível de atividade'}</FL>
              <Select value={f('activity_level')} onValueChange={setV('activity_level')}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_LEVELS.map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FL>{language === 'en-US' ? 'Dietary Style' : 'Estilo alimentar'}</FL>
              <Input value={f('dietary_style')} onChange={setI('dietary_style')} placeholder={language === 'en-US' ? 'E.g., Carnivore, Mediterranean, low-carb…' : 'Ex: Carnívoro, mediterrâneo, low-carb…'} className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <FL>{language === 'en-US' ? 'Training Goal' : 'Objetivo de treino'}</FL>
              <Input value={f('training_goal')} onChange={setI('training_goal')} placeholder={language === 'en-US' ? 'E.g., Hypertrophy, fat loss…' : 'Ex: Hipertrofia, emagrecimento…'} className="h-10 rounded-lg text-[13px]" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <div className="surface rounded-xl p-5 space-y-4">
            <p className="t-label">{language === 'en-US' ? 'Body Goals' : 'Metas corporais'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FL>{language === 'en-US' ? 'Target Weight (kg)' : 'Peso alvo (kg)'}</FL>
                <Input type="number" step="0.1" value={f('target_weight')} onChange={setI('target_weight')} placeholder="75" className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FL>{language === 'en-US' ? 'Target Body Fat (%)' : 'Gordura alvo (%)'}</FL>
                <Input type="number" step="0.1" value={f('body_fat_goal')} onChange={setI('body_fat_goal')} placeholder="12" className="h-10 rounded-lg text-[13px]" />
              </div>
            </div>

            <p className="t-label pt-1">{language === 'en-US' ? 'Daily Macros' : 'Macros diários'}</p>
            <div className="grid grid-cols-2 gap-3">
              {(language === 'en-US'
                ? [['calories_target','Calories (kcal)','2200'],['protein_target','Protein (g)','160'],['carbs_target','Carbs (g)','250'],['fat_target','Fat (g)','70']]
                : [['calories_target','Calorias (kcal)','2200'],['protein_target','Proteína (g)','160'],['carbs_target','Carboidratos (g)','250'],['fat_target','Gordura (g)','70']]
              ).map(([k,l,ph]) => (
                <div key={k}>
                  <FL>{l}</FL>
                  <Input type="number" value={f(k)} onChange={setI(k)} placeholder={ph} className="h-10 rounded-lg text-[13px]" />
                </div>
              ))}
            </div>
            <div>
              <FL>{language === 'en-US' ? 'Water (L / day)' : 'Água (L / dia)'}</FL>
              <Input type="number" step="0.25" value={f('water_target')} onChange={setI('water_target')} placeholder="3" className="h-10 rounded-lg text-[13px] w-40" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <div className="surface rounded-xl p-5 space-y-4">
            <div>
              <FL>{language === 'en-US' ? 'Atlas AI Tone' : 'Tom do Atlas AI'}</FL>
              <Select value={f('ai_tone_preference')} onValueChange={setV('ai_tone_preference')}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">{language === 'en-US' ? 'Friendly & Encouraging' : 'Amigável e encorajador'}</SelectItem>
                  <SelectItem value="direct">{language === 'en-US' ? 'Direct & Objective' : 'Direto e objetivo'}</SelectItem>
                  <SelectItem value="motivational">{language === 'en-US' ? 'Motivational & Intense' : 'Motivacional e intenso'}</SelectItem>
                  <SelectItem value="analytical">{language === 'en-US' ? 'Analytical & Technical' : 'Analítico e técnico'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FL>{language === 'en-US' ? 'Theme' : 'Tema'}</FL>
              <Select value={theme} onValueChange={(v) => { setTheme(v); setForm(p => ({ ...p, theme_preference: v })); }}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{language === 'en-US' ? 'Light (default)' : 'Claro (padrão)'}</SelectItem>
                  <SelectItem value="dark">{language === 'en-US' ? 'Dark' : 'Escuro'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saveMut.isPending}
        className="btn btn-primary w-full h-11 rounded-xl text-[14px] gap-2"
      >
        {saveMut.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'en-US' ? 'Saving…' : 'Salvando…'}</>
          : <><Save className="w-4 h-4" /> {language === 'en-US' ? 'Save Profile' : 'Salvar perfil'}</>
        }
      </button>

      {/* Achievements */}
      <AchievementsSection />

      {/* Professional links */}
      <ProfessionalLinks showPending={true} showActive={true} />

      {/* Subscription */}
      <Link to="/Pricing"
        className="surface rounded-xl p-5 flex items-center justify-between hover:border-[hsl(var(--brand)/0.3)] transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand)/0.08)] flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[hsl(var(--brand))]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[14px] font-semibold">{language === 'en-US' ? 'Plans & Subscription' : 'Planos e assinatura'}</p>
            <p className="t-caption">
              {subscription?.status === 'trialing'
                ? `Trial ativo — ${subscription.plan_code} até ${subscription.trial_ends_at}`
                : subscription?.status === 'active'
                  ? `Plano ${subscription.plan_code} ativo`
                  : 'Ver planos Pro, Performance, Coach e Clínico'}
            </p>
          </div>
        </div>
        <span className="text-[hsl(var(--brand))] text-[13px] font-medium group-hover:underline">{language === 'en-US' ? 'View plans →' : 'Ver planos →'}</span>
      </Link>

      {/* Danger zone */}
      <div className="surface rounded-xl p-5" style={{ borderColor: 'hsl(var(--err)/0.25)' }}>
        <p className="t-label text-[hsl(var(--err))] mb-2">{language === 'en-US' ? 'Danger Zone' : 'Zona de perigo'}</p>
        <p className="t-caption mb-3">{language === 'en-US' ? 'Permanently delete all your data: meals, workouts, measurements, check-ins, protocols, supplements, exams, and photos.' : 'Apaga permanentemente todos os seus registros: refeições, treinos, medidas, check-ins, protocolos, suplementos, exames e fotos.'}</p>
        <button onClick={() => setShowReset(true)}
          className="btn btn-secondary text-[hsl(var(--err))] border-[hsl(var(--err)/0.3)] hover:bg-[hsl(var(--err)/0.07)] gap-2">
          <Trash2 className="w-3.5 h-3.5" /> {language === 'en-US' ? 'Delete All Data' : 'Apagar todos os dados'}
        </button>
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-sm bg-[hsl(var(--card))] border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--err))]">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} /> {language === 'en-US' ? 'Confirm Deletion' : 'Confirmar exclusão'}
            </DialogTitle>
          </DialogHeader>
          <p className="t-body text-muted-foreground">{language === 'en-US' ? 'This action is irreversible. All your data will be permanently deleted.' : 'Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.'}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowReset(false)} className="btn btn-secondary flex-1">{language === 'en-US' ? 'Cancel' : 'Cancelar'}</button>
            <button onClick={resetAllData} disabled={resetting}
              className="btn flex-1 bg-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.88)] text-white border-0">
              {resetting ? (language === 'en-US' ? 'Deleting…' : 'Apagando…') : (language === 'en-US' ? 'Yes, delete all' : 'Sim, apagar tudo')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change email modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-sm bg-[hsl(var(--card))] border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> {language === 'en-US' ? 'Change Email' : 'Alterar e-mail'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="t-label block mb-1.5">{language === 'en-US' ? 'New Email' : 'Novo e-mail'}</label>
              <Input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
                className="h-10 rounded-lg text-[13px]"
                onKeyDown={e => e.key === 'Enter' && changeEmail()}
              />
            </div>
            <p className="text-[12px] text-[hsl(var(--fg-2))]">{language === 'en-US' ? 'After changing, you may need to log in again.' : 'Após alterar, pode ser necessário fazer login novamente.'}</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowEmailModal(false)} className="btn btn-secondary flex-1">{language === 'en-US' ? 'Cancel' : 'Cancelar'}</button>
              <button onClick={changeEmail} disabled={emailSaving || !newEmail.trim()} className="btn btn-primary flex-1 gap-1.5">
                {emailSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {language === 'en-US' ? 'Save' : 'Salvar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change password modal */}
      <Dialog open={showPasswordModal} onOpenChange={(v) => { setShowPasswordModal(v); setPasswordSent(false); }}>
        <DialogContent className="sm:max-w-sm bg-[hsl(var(--card))] border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> {language === 'en-US' ? 'Change Password' : 'Alterar senha'}
            </DialogTitle>
          </DialogHeader>
          {passwordSent ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-[14px] font-semibold text-[hsl(var(--ok))]">{language === 'en-US' ? 'Redirecting…' : 'Redirecionando…'}</p>
              <p className="text-[13px] text-[hsl(var(--fg-2))]">{language === 'en-US' ? 'You will be taken to the login screen to reset your password.' : 'Você será levado para a tela de login para redefinir sua senha.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-[hsl(var(--fg-2))]">
                {language === 'en-US'
                  ? 'To change your password, you will be logged out and can use the "Forgot password" option on the login screen to create a new password.'
                  : 'Para alterar sua senha, você será deslogado e poderá usar a opção "Esqueci a senha" na tela de login para criar uma nova senha.'
                }
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowPasswordModal(false)} className="btn btn-secondary flex-1">{language === 'en-US' ? 'Cancel' : 'Cancelar'}</button>
                <button onClick={sendPasswordReset} className="btn btn-primary flex-1">
                  {language === 'en-US' ? 'Go to Reset' : 'Ir para redefinição'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}