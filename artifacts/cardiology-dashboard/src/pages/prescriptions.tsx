import React, { useState, useRef, useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { usePrescriptions, type Medication, type Prescription } from '@/hooks/use-prescriptions';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Input, Label, Textarea, Badge, Modal } from '@/components/ui';
import {
  Pill, Plus, Trash2, Printer, Search, X,
  FileText, Calendar, Heart, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_MED: Omit<Medication, 'id'> = {
  name: '',
  dosage: '',
  duration: '',
  instructions: '',
};

function MedRow({
  med, idx, onChange, onRemove, canRemove,
}: {
  med: Medication;
  idx: number;
  onChange: (id: string, field: keyof Medication, val: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 p-5 rounded-2xl border border-border/60 bg-secondary/20 relative group hover:bg-secondary/40 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">{idx + 1}</div>
        <span className="text-xs font-bold text-foreground">TRAITEMENT {idx + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(med.id)} className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2">
          <Label>MÉDICAMENT *</Label>
          <Input required placeholder="Ex: Ramipril 5mg" value={med.name} onChange={e => onChange(med.id, 'name', e.target.value)} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>POSOLOGIE *</Label>
          <Input required placeholder="Ex: 1 cp/jour" value={med.dosage} onChange={e => onChange(med.id, 'dosage', e.target.value)} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>DURÉE *</Label>
          <Input required placeholder="Ex: 30 jours" value={med.duration} onChange={e => onChange(med.id, 'duration', e.target.value)} />
        </div>
        <div className="col-span-2 md:col-span-4">
          <Label>INDICATIONS <span className="text-muted-foreground font-normal normal-case">(optionnel)</span></Label>
          <Input placeholder="Ex: Le matin au réveil" value={med.instructions} onChange={e => onChange(med.id, 'instructions', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function PrintView({ prescription, onClose }: { prescription: Prescription; onClose: () => void }) {
  const { profile } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Print toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border print:hidden shrink-0 bg-secondary/30 rounded-t-2xl">
          <p className="text-sm font-bold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Aperçu avant impression
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">Fermer</Button>
            <Button size="sm" onClick={handlePrint} className="px-6">
              Imprimer
            </Button>
          </div>
        </div>

        {/* Ordonnance - A4 Frame */}
        <div className="overflow-y-auto flex-1 p-8 print:p-0 bg-secondary/10">
          <div
            ref={printRef}
            id="prescription-print"
            className="bg-white text-black mx-auto p-12 shadow-sm rounded-sm"
            style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Algerian Standard Header */}
            <div className="flex justify-between items-start mb-12">
              <div className="max-w-[60%]">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-1">
                  Dr. {profile?.full_name || '______________'}
                </h1>
                <p className="text-lg font-bold text-gray-800 italic mb-3">
                  {profile?.specialty || 'Spécialiste'}
                </p>
                <div className="text-base text-gray-900 leading-relaxed font-sans mt-2 space-y-0.5">
                  <p>{profile?.address}</p>
                  <p>Tél: <span className="font-semibold">{profile?.phone}</span></p>
                </div>
              </div>

              <div className="text-right pt-2 font-sans">
                <p className="text-lg text-black">
                  Le <span className="font-semibold">{format(new Date(prescription.date), 'dd MMMM yyyy', { locale: fr })}</span>
                </p>
              </div>
            </div>

            {/* Central Ordonnance Title */}
            <div className="text-center mb-14 mt-4">
              <h2 className="text-3xl font-bold uppercase tracking-[0.2em] border-b-[3px] border-black pb-2 inline-block px-8">
                ORDONNANCE
              </h2>
            </div>

            {/* Patient Info */}
            <div className="mb-14 text-lg font-sans">
              <div className="flex justify-between items-end border-b border-gray-300 pb-2">
                <p>
                  <span className="font-bold text-black uppercase tracking-wider text-sm mr-4">Nom et Prénom :</span>
                  <span className="font-bold text-xl">{prescription.patient_name}</span>
                </p>
                {prescription.patient_age && (
                  <p>
                    <span className="font-bold text-black uppercase tracking-wider text-sm mr-4">Âge :</span>
                    <span className="font-bold text-xl">{prescription.patient_age} ans</span>
                  </p>
                )}
              </div>
            </div>

            {/* Medications Body */}
            <div className="space-y-6 font-sans min-h-[300px]">
              {prescription.medications.map((med, i) => (
                <div key={med.id} className="flex gap-4 ml-4">
                  <div className="text-xl font-bold mt-0.5 min-w-[24px]">
                    {i + 1}-
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="font-bold text-xl uppercase tracking-wide">{med.name}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 text-lg">
                      <span className="italic text-gray-800">{med.dosage}</span>
                      <span className="text-gray-600">.............. pendant <span className="font-bold">{med.duration}</span></span>
                    </div>
                    {med.instructions && (
                      <p className="text-base text-gray-600 mt-1">*{med.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes Section (if any) */}
            {prescription.notes && (
              <div className="mt-12 font-sans p-6 bg-gray-50 border-l-4 border-gray-400">
                <p className="font-bold uppercase tracking-wider text-sm mb-2 text-gray-800">Remarques :</p>
                <p className="text-lg italic text-gray-800 whitespace-pre-wrap">{prescription.notes}</p>
              </div>
            )}

            {/* Signature Area */}
            <div className="mt-24 mb-10 flex justify-end font-sans">
              <div className="text-center w-64 mr-8">
                <p className="text-sm font-bold uppercase tracking-widest text-black mb-16">Cachet et Signature</p>
                <div className="border-b border-gray-400 border-dashed w-full" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Print styles injected globally */}
      <style>{`
        @media print {
          @page {
            margin: 0; /* Removes browser headers and footers (localhost, page numbers) */
          }
          html, body {
            height: 100vh;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden; /* Prevents scrolling from adding blank pages */
          }
          body * { visibility: hidden !important; }
          #prescription-print, #prescription-print * { visibility: visible !important; }
          #prescription-print {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important; height: 297mm !important;
            margin: 0 !important; padding: 20mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important; border-radius: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function Prescriptions() {
  const { data: patients } = usePatients();
  const { prescriptions, addPrescription, deletePrescription } = usePrescriptions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<Prescription | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { id: crypto.randomUUID(), ...EMPTY_MED },
  ]);
  const [historyTarget, setHistoryTarget] = useState<Prescription[] | null>(null);

  const groupedPrescriptions = useMemo(() => {
    const groups: Record<string, Prescription[]> = {};
    const sorted = [...prescriptions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach(p => {
      const key = p.patient_id || p.patient_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.values(groups);
  }, [prescriptions]);

  const filteredPatients = (patients || []).filter(p =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.card_id && p.card_id.toLowerCase().includes(patientSearch.toLowerCase()))
  ).slice(0, 6);

  const addMed = () => setMedications(m => [...m, { id: crypto.randomUUID(), ...EMPTY_MED }]);
  const removeMed = (id: string) => setMedications(m => m.filter(x => x.id !== id));
  const updateMed = (id: string, field: keyof Medication, val: string) =>
    setMedications(m => m.map(x => x.id === id ? { ...x, [field]: val } : x));

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setNotes('');
    setMedications([{ id: crypto.randomUUID(), ...EMPTY_MED }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const p = addPrescription({
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.full_name,
      patient_card_id: selectedPatient.card_id,
      patient_age: String(selectedPatient.age || ''),
      date: new Date().toISOString(),
      medications,
      notes,
    });
    setIsFormOpen(false);
    resetForm();
    setPrintTarget(p);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Pill className="h-6 w-6 text-accent" />
            </div>
            Ordonnances Médicales
          </h1>
          <p className="text-muted-foreground mt-2">{prescriptions.length} ordonnance{prescriptions.length > 1 ? 's' : ''} enregistrée{prescriptions.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="px-6 h-12">
          <Plus className="h-5 w-5 mr-2" /> Créer une Ordonnance
        </Button>
      </div>

      {/* Prescription list */}
      {prescriptions.length === 0 ? (
        <Card className="py-20 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold">Aucune Ordonnance</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Créez votre première ordonnance pour l'imprimer directement selon le format algérien.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {groupedPrescriptions.map(group => {
            const firstP = group[0];
            return (
              <motion.div key={firstP.patient_id || firstP.patient_name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card 
                  className="p-6 cursor-pointer border-border/60 hover:shadow-lg hover:border-primary/50 hover:bg-secondary/10 transition-all duration-300 group flex flex-col h-full"
                  onClick={() => setHistoryTarget(group)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                      {firstP.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">{firstP.patient_name}</h3>
                      {firstP.patient_card_id && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{firstP.patient_card_id}</p>}
                    </div>
                    <Badge variant="teal" className="shrink-0 text-[10px] font-bold px-2 py-0.5">{group.length} ord.</Badge>
                  </div>
                  
                  <div className="mt-auto text-xs font-semibold text-muted-foreground border-t border-border/50 pt-4 pb-1 flex justify-between items-center group-hover:text-foreground transition-colors">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary/70"/> Dernier: {format(new Date(firstP.date), 'dd MMM yyyy', { locale: fr })}</span>
                    <ChevronRight className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Patient History Modal */}
      <Modal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Historique de ${historyTarget?.[0]?.patient_name || ''}`} size="xl" className="max-w-6xl w-[95vw] h-[85vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2 pb-6">
          {historyTarget?.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="h-full">
              <Card className="p-5 flex flex-col gap-4 border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-300 h-full">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(new Date(p.date), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                  <Badge variant="teal" className="text-[10px] font-bold px-2 py-0.5">{p.medications.length} Méd.</Badge>
                </div>
                
                <div className="space-y-3 flex-1 pt-1">
                  {p.medications.slice(0, 3).map((m, i) => (
                    <div key={m.id} className="flex flex-col gap-0.5">
                      <div className="flex items-start gap-2">
                        <Pill className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-sm text-foreground leading-tight">{m.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-[22px] italic">{m.dosage} <span className="opacity-70 mx-0.5">•</span> {m.duration}</span>
                    </div>
                  ))}
                  {p.medications.length > 3 && (
                    <p className="text-xs font-semibold text-primary pt-2 pl-[22px]">+{p.medications.length - 3} autres</p>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 mt-auto border-t border-border/40">
                  <Button type="button" variant="secondary" size="sm" className="flex-1 h-9" onClick={() => { setPrintTarget(p); setHistoryTarget(null); }}>
                    <Printer className="h-4 w-4 mr-2" /> Imprimer
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => {
                    if (confirm(`Supprimer l'ordonnance du ${format(new Date(p.date), 'dd/MM/yyyy')} ?`)) {
                      deletePrescription(p.id);
                      setHistoryTarget(prev => prev?.filter(x => x.id !== p.id) || null);
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
          {historyTarget?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">Aucune ordonnance trouvée.</div>
          )}
        </div>
      </Modal>

      {/* New Prescription Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); resetForm(); }} title="Nouvelle Ordonnance" className="max-w-5xl w-[95vw] h-[85vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="space-y-6 flex-1 pr-2">

            <div className="grid lg:grid-cols-[300px_1fr] gap-6">

              {/* Patient Selection Column */}
              <div className="space-y-4">
                <div className="bg-secondary/20 p-5 rounded-2xl border border-border">
                  <Label className="text-xs border-b border-border pb-2 mb-4 block">SELECTION PATIENT *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required={!selectedPatient}
                      placeholder="Rechercher par nom..."
                      className="pl-10 h-11"
                      value={selectedPatient ? selectedPatient.full_name : patientSearch}
                      onChange={e => {
                        setPatientSearch(e.target.value);
                        setSelectedPatient(null);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                    />
                    {selectedPatient && (
                      <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showPatientDropdown && !selectedPatient && filteredPatients.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                      >
                        {filteredPatients.map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-0"
                            onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); }}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {p.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{p.full_name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{p.age} ans · {p.gender}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selectedPatient && (
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Patient Sélectionné</p>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{selectedPatient.full_name}</span>
                        <span className="text-xs bg-card px-2 py-0.5 rounded-md border border-border shadow-sm">{selectedPatient.age} ans</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications & Notes Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Heart className="h-5 w-5 text-accent" /> Le Traitement
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addMed} className="h-8">
                    <Plus className="h-4 w-4 mr-2" /> Ajouter un Médicament
                  </Button>
                </div>

                <div className="space-y-4">
                  {medications.map((med, i) => (
                    <MedRow key={med.id} med={med} idx={i} onChange={updateMed} onRemove={removeMed} canRemove={medications.length > 1} />
                  ))}
                </div>

                <div className="pt-4 border-t border-border mt-6">
                  <Label>REMARQUES ET CONSEILS (Optionnel)</Label>
                  <Textarea className="h-24 mt-2" placeholder="Régime sans sel, repos, etc..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-auto shrink-0 shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)]">
            <Button type="button" variant="ghost" onClick={() => { setIsFormOpen(false); resetForm(); }}>Annuler</Button>
            <Button type="submit" disabled={!selectedPatient} className="px-8 font-bold">
              <FileText className="h-4 w-4 mr-2" /> Sauvegarder & Imprimer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Preview Mode */}
      {printTarget && <PrintView prescription={printTarget} onClose={() => setPrintTarget(null)} />}
    </div>
  );
}
