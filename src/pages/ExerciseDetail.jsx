import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const MUSCLE_EMOJIS = {
  chest: '🫀', back: '📦', shoulders: '🔱', biceps: '💪', triceps: '💪', forearms: '💪',
  legs: '🦵', quads: '🦵', hamstrings: '🦵', glutes: '🍑', calves: '🦵',
  core: '⭕', abs: '⭕', obliques: '⭕', lower_back: '📦', traps: '📦',
};

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: exercise, isLoading } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => base44.entities.ExerciseMaster.filter({ id }).then(r => r?.[0]),
  });

  const { data: log } = useQuery({
    queryKey: ['exercise-log', id],
    queryFn: () => base44.entities.ExerciseLog.filter({ exercise_master_id: id }).then(r => r?.[0]),
  });

  const { data: substitutes = [] } = useQuery({
    queryKey: ['substitutes', exercise?.substitutions],
    queryFn: () => {
      if (!exercise?.substitutions?.length) return [];
      return Promise.all(exercise.substitutions.map(sid => base44.entities.ExerciseMaster.filter({ id: sid }).then(r => r?.[0])));
    },
    enabled: !!exercise?.substitutions?.length,
  });

  const toggleFavMut = useMutation({
    mutationFn: async () => {
      if (!log?.id) {
        // Create log entry
        await base44.entities.ExerciseLog.create({
          exercise_master_id: id,
          exercise_name: exercise?.canonical_name_pt,
          is_favorite: !isFavorite,
          last_used_at: new Date().toISOString(),
        });
      } else {
        // Update existing
        await base44.entities.ExerciseLog.update(log.id, { is_favorite: !isFavorite });
      }
      setIsFavorite(!isFavorite);
      qc.invalidateQueries({ queryKey: ['exercise-log', id] });
    },
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (!exercise) return <div className="p-8 text-center t-caption">Exercício não encontrado</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[hsl(var(--border-h))]">
        <div className="p-4 lg:p-5 flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-[hsl(var(--brand))] font-medium hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <button
            onClick={() => toggleFavMut.mutate()}
            disabled={toggleFavMut.isPending}
            className="p-2 rounded-lg hover:bg-[hsl(var(--shell))] transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-[hsl(var(--err))]' : 'text-[hsl(var(--fg-2))]'}`} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h1 className="t-headline mb-1">{exercise.canonical_name_pt}</h1>
          {exercise.canonical_name_en && <p className="t-caption">{exercise.canonical_name_en}</p>}
        </div>

        {/* Image */}
        {exercise.media_image_url && (
          <div className="rounded-xl overflow-hidden bg-[hsl(var(--shell))] aspect-video">
            <img src={exercise.media_image_url} alt={exercise.canonical_name_pt} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="surface rounded-xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {exercise.difficulty_level && (
            <div>
              <p className="t-label">Dificuldade</p>
              <p className="text-[14px] font-medium mt-1 capitalize">{exercise.difficulty_level}</p>
            </div>
          )}
          {exercise.movement_pattern && (
            <div>
              <p className="t-label">Padrão</p>
              <p className="text-[14px] font-medium mt-1 capitalize">{exercise.movement_pattern}</p>
            </div>
          )}
          {exercise.is_compound && (
            <div>
              <p className="t-label">Tipo</p>
              <p className="text-[14px] font-medium mt-1">Composto</p>
            </div>
          )}
          {exercise.is_unilateral && (
            <div>
              <p className="t-label">Unilateral</p>
              <p className="text-[14px] font-medium mt-1">Sim</p>
            </div>
          )}
        </div>

        {/* Muscles */}
        {(exercise.primary_muscles?.length > 0 || exercise.secondary_muscles?.length > 0) && (
          <div className="surface rounded-xl p-5 space-y-4">
            <p className="t-subtitle">Músculos Envolvidos</p>
            {exercise.primary_muscles?.length > 0 && (
              <div>
                <p className="t-label mb-2">Primários</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map(m => (
                    <span key={m} className="badge badge-blue text-[12px]">
                      {MUSCLE_EMOJIS[m] || '•'} {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <p className="t-label mb-2">Secundários</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map(m => (
                    <span key={m} className="badge badge-neutral text-[12px]">
                      {MUSCLE_EMOJIS[m] || '•'} {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {exercise.instructions_short_pt && (
          <div className="surface rounded-xl p-5 space-y-3">
            <p className="t-subtitle">Como Fazer</p>
            <p className="text-[14px] leading-relaxed text-[hsl(var(--fg-2))]">{exercise.instructions_short_pt}</p>
          </div>
        )}

        {/* Form Cues */}
        {exercise.form_cues_pt?.length > 0 && (
          <div className="surface rounded-xl p-5 space-y-3">
            <p className="t-subtitle">Pontos Importantes</p>
            <ul className="space-y-2">
              {exercise.form_cues_pt.map((cue, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[hsl(var(--brand))] font-bold">✓</span>
                  <span className="text-[14px] text-[hsl(var(--fg-2))]">{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.common_mistakes_pt?.length > 0 && (
          <div className="surface rounded-xl p-5 space-y-3 border-[hsl(var(--warn)/0.2)]">
            <p className="t-subtitle">Erros Comuns</p>
            <ul className="space-y-2">
              {exercise.common_mistakes_pt.map((mistake, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[hsl(var(--warn))] font-bold">✗</span>
                  <span className="text-[14px] text-[hsl(var(--fg-2))]">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Substitutes */}
        {substitutes.length > 0 && (
          <div className="surface rounded-xl p-5 space-y-3">
            <p className="t-subtitle">Variações e Substitutos</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {substitutes.map(sub => (
                <button
                  key={sub?.id}
                  onClick={() => navigate(`/exercise/${sub?.id}`)}
                  className="p-3 rounded-lg bg-[hsl(var(--shell))] hover:border-[hsl(var(--brand)/0.3)] border border-transparent transition-all text-left"
                >
                  <p className="text-[13px] font-medium text-[hsl(var(--fg))]">{sub?.canonical_name_pt}</p>
                  {sub?.difficulty_level && (
                    <p className="text-[11px] text-[hsl(var(--fg-2))] mt-1 capitalize">{sub.difficulty_level}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {log && (
          <div className="surface rounded-xl p-5 space-y-3">
            <p className="t-subtitle">Seu Histórico</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="t-label">Usado</p>
                <p className="text-[16px] font-bold mt-1">{log.use_count || 0}× </p>
              </div>
              <div>
                <p className="t-label">Última vez</p>
                <p className="text-[14px] font-medium mt-1">
                  {log.last_used_at ? new Date(log.last_used_at).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
              {log.personal_record_weight && (
                <div>
                  <p className="t-label">Recorde</p>
                  <p className="text-[14px] font-medium mt-1">{log.personal_record_weight}kg × {log.personal_record_reps}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <button className="btn btn-primary w-full h-11 rounded-xl text-[14px] gap-2 sticky bottom-5">
          <Zap className="w-4 h-4" /> Adicionar ao Treino
        </button>
      </div>
    </div>
  );
}