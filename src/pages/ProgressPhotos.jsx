import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import { Camera, Upload, Loader2, X, GitCompare, Grid3X3, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES = { front: 'Frente', back: 'Costas', side: 'Lateral', pose: 'Pose' };
const CAT_BADGE = { front: 'badge-blue', back: 'badge-neutral', side: 'badge-ok', pose: 'badge-ai' };

function PhotoCard({ photo, onDelete, onSelect, selected }) {
  const date = photo.date ? new Date(photo.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
  return (
    <div
      onClick={() => onSelect(photo)}
      className={`relative rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${selected ? 'border-[hsl(var(--brand))]' : 'border-transparent hover:border-[hsl(var(--border-h))]'}`}>
      <img src={photo.photo_url} alt={date} className="w-full aspect-[3/4] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <span className={`badge ${CAT_BADGE[photo.category] || 'badge-neutral'} text-[10px]`}>{CATEGORIES[photo.category] || photo.category}</span>
            <p className="text-white text-[11px] mt-0.5">{date}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
            className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black/60 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}

export default function ProgressPhotos() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useSubscription();
  const fileRef = useRef(null);

  // All hooks must be called before any conditional return
  const [showUpload, setShowUpload] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [uploadForm, setUploadForm] = useState({ category: 'front', date: new Date().toISOString().split('T')[0], weight: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigate('/Landing', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  // Check entitlement after all hooks
  if (!can('progress_photos')) {
    return (
      <div className="h-screen flex items-center justify-center p-5">
        <UpgradeGate feature="progress_photos" plan="Pro" title="Fotos de Progresso — Plano Pro+" description="Registre sua evolução visual e compare fotos" />
      </div>
    );
  }

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['progress-photos'],
    queryFn: () => base44.entities.ProgressPhoto.list('-date'),
  });

  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.ProgressPhoto.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress-photos'] }); toast.success('Foto removida'); },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    await base44.entities.ProgressPhoto.create({
      photo_url: file_url,
      date: uploadForm.date,
      category: uploadForm.category,
      weight: uploadForm.weight ? Number(uploadForm.weight) : undefined,
      notes: uploadForm.notes || undefined,
    });
    qc.invalidateQueries({ queryKey: ['progress-photos'] });
    toast.success('Foto adicionada!');
    setShowUpload(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadForm({ category: 'front', date: new Date().toISOString().split('T')[0], weight: '', notes: '' });
    setUploading(false);
  };

  const handleSelect = (photo) => {
    if (!compareMode) return;
    setCompareSelected(prev => {
      if (prev.find(p => p.id === photo.id)) return prev.filter(p => p.id !== photo.id);
      if (prev.length >= 2) return [prev[1], photo];
      return [...prev, photo];
    });
  };

  const filtered = filterCat === 'all' ? photos : photos.filter(p => p.category === filterCat);

  // Group by date for gallery
  const grouped = filtered.reduce((acc, p) => {
    const key = p.date || 'sem data';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-5 border-b border-[hsl(var(--border-h))]">
        <div>
          <h1 className="t-headline">Fotos de Progresso</h1>
          <p className="t-small mt-1">{photos.length} foto{photos.length !== 1 ? 's' : ''} registrada{photos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCompareMode(c => !c); setCompareSelected([]); }}
            className={`btn gap-1.5 ${compareMode ? 'btn-primary' : 'btn-secondary'}`}>
            <GitCompare className="w-3.5 h-3.5" />
            {compareMode ? 'Sair comparação' : 'Comparar'}
          </button>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Nova foto
          </button>
        </div>
      </div>

      {/* Compare view */}
      {compareMode && compareSelected.length === 2 && (
        <div className="surface p-4">
          <p className="t-label mb-3">Comparação Antes / Depois</p>
          <div className="grid grid-cols-2 gap-4">
            {compareSelected.map((p, i) => (
              <div key={p.id}>
                <p className="t-caption mb-1 text-center">{i === 0 ? 'Antes' : 'Depois'} · {new Date(p.date + 'T12:00').toLocaleDateString('pt-BR')}</p>
                <img src={p.photo_url} alt="" className="w-full aspect-[3/4] object-cover rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}
      {compareMode && compareSelected.length < 2 && (
        <div className="surface p-4 text-center">
          <p className="t-small text-[hsl(var(--fg-2))]">
            Selecione {2 - compareSelected.length} foto{2 - compareSelected.length > 1 ? 's' : ''} para comparar
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', ...Object.keys(CATEGORIES)].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`badge cursor-pointer transition-colors ${filterCat === cat ? 'badge-blue' : 'badge-neutral hover:bg-[hsl(var(--shell))]'}`}>
            {cat === 'all' ? 'Todas' : CATEGORIES[cat]}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 t-small text-[hsl(var(--fg-2))]">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Camera className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhuma foto registrada</p>
          <p className="t-caption mb-4">Registre sua evolução visual ao longo do tempo.</p>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Adicionar foto
          </button>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, ps]) => (
          <div key={date}>
            <p className="t-label mb-2">{date !== 'sem data' ? new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sem data'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ps.map(p => (
                <PhotoCard key={p.id} photo={p}
                  onDelete={(id) => deleteM.mutate(id)}
                  onSelect={handleSelect}
                  selected={compareSelected.some(s => s.id === p.id)} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border-h))] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="t-subtitle">Adicionar foto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* File picker */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative aspect-[3/4] rounded-xl border-2 border-dashed border-[hsl(var(--border-h))] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--brand)/0.4)] transition-colors overflow-hidden ${previewUrl ? 'border-transparent' : ''}`}>
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-[13px] font-medium">Trocar foto</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[hsl(var(--fg-2))]" strokeWidth={1.5} />
                  <p className="t-small text-[hsl(var(--fg-2))]">Clique para selecionar</p>
                  <p className="t-caption">JPG, PNG até 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Categoria</label>
                <Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-9 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="t-label block mb-1.5">Data</label>
                <Input type="date" value={uploadForm.date} onChange={e => setUploadForm(f => ({ ...f, date: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
              </div>
            </div>
            <div>
              <label className="t-label block mb-1.5">Peso nesta data (kg)</label>
              <Input type="number" step="0.1" value={uploadForm.weight} onChange={e => setUploadForm(f => ({ ...f, weight: e.target.value }))} placeholder="Ex: 82.5" className="h-9 rounded-lg text-[13px]" />
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn btn-primary w-full h-11 rounded-xl gap-1.5">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Enviando…' : 'Salvar foto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}