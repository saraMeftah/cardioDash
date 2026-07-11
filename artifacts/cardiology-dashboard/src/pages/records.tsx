import React, { useState, useMemo } from 'react';
import { useMedicalRecords, useUploadRecord, useDeleteRecord } from '@/hooks/use-records';
import { usePatients } from '@/hooks/use-patients';
import { SignedFileLink } from '@/components/SignedFileLink';
import { Card, Button, Modal, Label, Input, Select, Badge, Textarea, Skeleton } from '@/components/ui';
import {
  FileText, Plus, Upload, Download, Search, Tag,
  Trash2, ChevronDown, ChevronUp, Stethoscope, Heart,
  Zap, ScanLine, FlaskConical, X, FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_CATEGORIES = ['ECG', 'CoroScan', 'Scanner', 'Bilan', 'Blood Test', 'X-Ray', 'MRI', 'Ultrasound', 'Report', 'Other'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'ECG': <Zap className="h-4 w-4" />,
  'CoroScan': <Heart className="h-4 w-4" />,
  'Scanner': <ScanLine className="h-4 w-4" />,
  'Bilan': <FlaskConical className="h-4 w-4" />,
  'Blood Test': <FlaskConical className="h-4 w-4" />,
  'X-Ray': <ScanLine className="h-4 w-4" />,
  'MRI': <ScanLine className="h-4 w-4" />,
  'Ultrasound': <Stethoscope className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'ECG': 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5',
  'CoroScan': 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5',
  'Scanner': 'border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5',
  'Bilan': 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5',
  'Blood Test': 'border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5',
  'X-Ray': 'border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/5',
  'MRI': 'border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5',
  'Ultrasound': 'border-cyan-200 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/5',
};

const BADGE_VARIANTS: Record<string, 'default' | 'teal' | 'warning' | 'destructive' | 'navy'> = {
  'ECG': 'destructive',
  'CoroScan': 'destructive',
  'Bilan': 'warning',
  'Blood Test': 'warning',
  'Scanner': 'navy',
  'MRI': 'purple' as any,
};

function RecordSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

function CategorySection({
  category,
  records,
  onDelete,
}: {
  category: string;
  records: any[];
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const colorClass = CATEGORY_COLORS[category] || 'border-border bg-secondary/20';
  const icon = CATEGORY_ICONS[category] || <FileText className="h-4 w-4" />;
  const badgeVariant = BADGE_VARIANTS[category] || 'default';

  return (
    <div className={`rounded-2xl border overflow-hidden ${colorClass}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 font-semibold text-sm hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">{icon}</span>
          <span>{category}</span>
          <Badge variant={badgeVariant as any} className="text-[10px] px-2 py-0">{records.length}</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border/40 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {records.map(rec => (
              <div key={rec.id} className="group flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-background hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm font-bold truncate">{rec.description || 'Document'}</p>
                  </div>
                  <button
                    onClick={() => onDelete(rec.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{rec.patients?.full_name || 'Unknown Patient'}</p>
                  {rec.patients?.card_id && <p className="font-mono">ID: {rec.patients.card_id}</p>}
                  {rec.notes && <p className="italic line-clamp-2">{rec.notes}</p>}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(rec.uploaded_at), 'MMM d, yyyy')}</span>
                  {rec.file_url && (
                    <SignedFileLink storagePath={rec.file_url}>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                        <Download className="h-3 w-3 mr-1" /> Open
                      </Button>
                    </SignedFileLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Records() {
  const { data: records, isLoading } = useMedicalRecords();
  const { data: patients } = usePatients();
  const uploadRecord = useUploadRecord();
  const deleteRecord = useDeleteRecord();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [newCatName, setNewCatName] = useState('');
  const [metrics, setMetrics] = useState<Array<{ name: string; value: string }>>([]);

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('custom_record_categories') || '[]'); }
    catch { return []; }
  });

  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    return [...new Set(combined)];
  }, [customCategories]);

  const [formData, setFormData] = useState({
    patient_id: '',
    description: '',
    category: 'ECG',
    notes: '',
  });

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed || allCategories.includes(trimmed)) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    localStorage.setItem('custom_record_categories', JSON.stringify(updated));
    setNewCatName('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return;
    const updated = customCategories.filter(c => c !== cat);
    setCustomCategories(updated);
    localStorage.setItem('custom_record_categories', JSON.stringify(updated));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedMetrics: Record<string, number> = {};
    metrics.forEach(m => {
      if (m.name.trim() && !isNaN(parseFloat(m.value))) {
        parsedMetrics[m.name.trim()] = parseFloat(m.value);
      }
    });
    const finalMetrics = Object.keys(parsedMetrics).length > 0 ? parsedMetrics : undefined;

    uploadRecord.mutate(
      { file: file || undefined, ...formData, metrics: finalMetrics },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setFile(null);
          setFormData({ patient_id: '', description: '', category: 'ECG', notes: '' });
          setMetrics([]);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteRecord.mutate(id);
  };

  const grouped = useMemo(() => {
    const filtered = (records || []).filter(r => {
      const matchSearch =
        !search ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.patients?.card_id?.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || r.category === filterCat;
      return matchSearch && matchCat;
    });

    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(r => {
      const cat = r.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [records, search, filterCat]);

  const totalFiltered = Object.values(grouped).reduce((a, b) => a + b.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Medical Records</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organized by category — {records?.length || 0} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCatModalOpen(true)}>
            <Tag className="h-4 w-4 mr-2" /> Categories
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Upload Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description, patient name or card ID..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-full sm:w-48" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mt-3">
          {['all', ...allCategories].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterCat === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
              {cat !== 'all' && grouped[cat] ? ` (${grouped[cat].length})` : ''}
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-3 gap-3">
                <RecordSkeleton /><RecordSkeleton /><RecordSkeleton />
              </div>
            </Card>
          ))}
        </div>
      ) : totalFiltered === 0 ? (
        <Card className="py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-bold">{search || filterCat !== 'all' ? 'No records match your filters' : 'No records yet'}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filterCat !== 'all' ? 'Try adjusting your search or category filter.' : 'Upload your first medical document.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, recs]) => (
            <CategorySection key={cat} category={cat} records={recs} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Upload Medical Record">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <Label>Patient *</Label>
            <Select required value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
              <option value="">Select a patient...</option>
              {patients?.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}{p.card_id ? ` — ${p.card_id}` : ''}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Category *</Label>
            <Select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>

          <div>
            <Label>Title / Description *</Label>
            <Input
              required
              placeholder="e.g. ECG - Resting 12-lead"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Clinical Notes</Label>
            <Textarea
              placeholder="Any relevant notes, findings or observations..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div>
            <Label>File Attachment <span className="normal-case text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.dcm" onChange={e => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG or DICOM — max 10MB</p>
          </div>

          {(formData.category === 'Bilan' || formData.category === 'Blood Test') && (
            <div className="pt-4 border-t border-border mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-accent">Track Biometrics (Optional)</Label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setMetrics([...metrics, { name: '', value: '' }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Test Result
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {metrics.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Test Name (e.g. D-Dimer)" value={m.name} onChange={e => {
                      const newM = [...metrics];
                      newM[i].name = e.target.value;
                      setMetrics(newM);
                    }} />
                    <Input placeholder="Value (e.g. 0.5)" type="number" step="any" value={m.value} onChange={e => {
                      const newM = [...metrics];
                      newM[i].value = e.target.value;
                      setMetrics(newM);
                    }} className="w-1/3" />
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => {
                      setMetrics(metrics.filter((_, idx) => idx !== i));
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2 bg-secondary/20 rounded-lg border border-dashed border-border/60">
                    No biomarkers added. You can attach structural test results here to visually track them over time.
                  </p>
                )}
              </div>
            </div>
          )}

          {uploadRecord.isError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {(uploadRecord.error as Error)?.message || 'Upload failed.'}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={uploadRecord.isPending || !formData.patient_id}>
              {uploadRecord.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Manage Categories">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Create custom categories for organizing medical records.</p>

          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
            />
            <Button onClick={handleAddCategory} disabled={!newCatName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">All Categories</p>
            <div className="grid grid-cols-2 gap-2">
              {allCategories.map(cat => {
                const isCustom = customCategories.includes(cat);
                return (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{CATEGORY_ICONS[cat] || <Tag className="h-3.5 w-3.5" />}</span>
                      <span className="text-sm font-medium">{cat}</span>
                    </div>
                    {isCustom && (
                      <button onClick={() => handleRemoveCategory(cat)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
