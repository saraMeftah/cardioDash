import React, { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { usePatient, useUpdatePatient } from '@/hooks/use-patients';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedicalRecords } from '@/hooks/use-records';
import { SignedFileLink } from '@/components/SignedFileLink';
import { Card, Button, Badge, Modal, Label, Input, Textarea, Select } from '@/components/ui';
import { User, Activity, Clock, FileText, Calendar, Pill, Edit, MapPin, Phone, Briefcase, CalendarCheck2, CheckCircle2, TrendingUp, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientProfile() {
  const [, params] = useRoute('/patients/:id');
  const id = params?.id || '';
  
  const { data: patient, isLoading: patientLoading } = usePatient(id);
  const { data: appointments } = useAppointments();
  const { data: records } = useMedicalRecords(id);
  const updatePatient = useUpdatePatient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const ptAppointments = appointments?.filter(a => a.patient_id === id) || [];
  
  // Appointment Tracking Logic
  const allSorted = [...ptAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedApts = allSorted.filter(a => a.status === 'completed');
  const upcomingApts = allSorted.filter(a => a.status === 'pending' || a.status === 'in_progress');
  
  const firstVisitDate = completedApts.length > 0 ? format(new Date(completedApts[0].date), 'MMM d, yyyy') : '—';
  const lastVisitDate = completedApts.length > 0 ? format(new Date(completedApts[completedApts.length - 1].date), 'MMM d, yyyy') : '—';
  const totalCompleted = completedApts.length;

  const [selectedMetric, setSelectedMetric] = useState<string>('');

  // Biomarker Tracking Logic
  const { allAvailableMetrics, metricChartData } = React.useMemo(() => {
    if (!records) return { allAvailableMetrics: [], metricChartData: [] };
    
    // Count occurrences of each metric
    const metricCounts: Record<string, number> = {};
    
    const chronoRecords = [...records].sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
    
    const cData = chronoRecords.map(r => {
      const datum: any = { 
        rawDate: r.uploaded_at,
        date: format(new Date(r.uploaded_at), 'd MMM yyyy') 
      };
      if (r.metrics) {
        Object.entries(r.metrics).forEach(([k, v]) => {
          metricCounts[k] = (metricCounts[k] || 0) + 1;
          datum[k] = v;
        });
      }
      return datum;
    });

    // Populate the dropdown with ALL metrics that exist for this patient (even just 1)
    const validMetricKeys = Object.keys(metricCounts).sort();

    const filteredData = cData.filter(d => selectedMetric && d[selectedMetric] !== undefined);

    return { 
      allAvailableMetrics: validMetricKeys,
      metricChartData: filteredData
    };
  }, [records, selectedMetric]);

  React.useEffect(() => {
    if (allAvailableMetrics.length > 0 && !selectedMetric) {
      setSelectedMetric(allAvailableMetrics[0]);
    }
  }, [allAvailableMetrics, selectedMetric]);

  const handleEditOpen = () => {
    if (patient) {
      setEditForm({
        full_name: patient.full_name,
        date_of_birth: patient.date_of_birth || '',
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone || '',
        address: patient.address || '',
        job: patient.job || '',
        diagnosis: patient.diagnosis || '',
        medications: patient.medications || '',
        medical_history: patient.medical_history || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    if (!dob) {
      setEditForm({ ...editForm, date_of_birth: '', age: '' });
      return;
    }
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    
    setEditForm({ 
      ...editForm, 
      date_of_birth: dob, 
      age: age.toString(), 
      card_id: `HC-${dob.replace(/-/g, '')}` 
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient.mutate({ 
      id, 
      ...editForm,
      age: editForm.age ? parseInt(editForm.age, 10) : 0 
    }, {
      onSuccess: () => setIsEditModalOpen(false)
    });
  };

  if (patientLoading) return <div className="p-12 text-center">Loading...</div>;
  if (!patient) return <div className="p-12 text-center text-destructive font-bold">Patient not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">{patient.full_name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {patient.card_id && <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{patient.card_id}</span>}
              <span>{patient.gender}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/patients/${id}/blood-tests`}>
            <Button variant="teal">
              <FlaskConical className="h-4 w-4 mr-2" /> Bilans sanguins
            </Button>
          </Link>
          <Button onClick={handleEditOpen}>
            <Edit className="h-4 w-4 mr-2" /> Edit Records
          </Button>
        </div>
      </div>

      {/* Analytics Tracking Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-card to-secondary/30">
          <div className="p-3 bg-secondary rounded-xl"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Completed</p>
            <p className="text-2xl font-bold font-display">{totalCompleted} <span className="text-sm font-normal text-muted-foreground tracking-normal">visits</span></p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-card to-secondary/30">
          <div className="p-3 bg-secondary rounded-xl"><CalendarCheck2 className="h-5 w-5 text-blue-500" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">First Appointment</p>
            <p className="text-xl font-bold">{firstVisitDate}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-card to-secondary/30">
          <div className="p-3 bg-secondary rounded-xl"><Clock className="h-5 w-5 text-amber-500" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Last Appointment</p>
            <p className="text-xl font-bold">{lastVisitDate}</p>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar: Demographics / Personal Info */}
        <div className="space-y-6">
          <Card className="p-6 border-t-4 border-t-primary">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personal Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date of Birth</p>
                <p className="font-medium mt-1">
                  {patient.date_of_birth ? format(new Date(patient.date_of_birth + 'T00:00:00'), 'MMMM d, yyyy') : 'Not specified'} 
                  <span className="text-muted-foreground ml-2">({patient.age} years)</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contact</p>
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone || 'No phone provided'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
                <div className="flex items-start gap-2 mt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <span>{patient.address || 'No address provided'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Occupation</p>
                <div className="flex items-center gap-2 mt-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.job || 'No occupation listed'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Agenda Upcoming */}
          <Card className="p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" /> Upcoming & Pending
            </h3>
            {upcomingApts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <div className="space-y-4">
                {upcomingApts.slice(0, 5).map(apt => (
                  <div key={apt.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(apt.date), 'h:mm a')}</p>
                    </div>
                    <Badge variant={apt.status === 'in_progress' ? 'teal' : 'warning'}>
                      {apt.status === 'in_progress' ? 'In Session' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Medical File */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-t-4 border-t-accent">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Activity className="text-accent h-5 w-5" /> Current Diagnosis
            </h2>
            <div className="bg-secondary/40 border border-secondary p-4 rounded-xl">
              <p className="text-foreground leading-relaxed">
                {patient.diagnosis || 'No active diagnosis recorded. Please update medical history.'}
              </p>
            </div>
          </Card>

          <Card className="p-6 border-t-4 border-t-emerald-500">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Pill className="text-emerald-500 h-5 w-5" /> Current Medications
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {patient.medications || 'No active medications on record.'}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <FileText className="text-muted-foreground h-5 w-5" /> Clinical History Notes
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {patient.medical_history || 'No historical clinical documentation recorded yet.'}
              </p>
            </div>
          </Card>

          {/* Quick Document Access (If any) */}
          {records && records.length > 0 && (
            <Card className="p-6 border-t-4 border-t-blue-500">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" /> Attached Scans & Records
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {records?.slice(0, 4).map(rec => (
                  <SignedFileLink
                    key={rec.id}
                    storagePath={rec.file_url}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.description || 'Medical Document'}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(rec.uploaded_at), 'MMM d, yyyy')}</p>
                    </div>
                  </SignedFileLink>
                ))}
              </div>
            </Card>
          )}

          {/* Biomarker Analytics Chart */}
          {allAvailableMetrics.length > 0 && (
            <Card className="p-6 border-t-4 border-t-accent mt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-accent h-5 w-5" /> Lab Result Analytics
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Biomarker progression extracted from Bilans</p>
                </div>
                <Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="w-full sm:w-48 bg-secondary/20">
                  {allAvailableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
              </div>

              {metricChartData.length >= 2 ? (
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dx={-10} domain={['auto', 'auto']} padding={{ top: 20, bottom: 20 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }} 
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--accent))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 bg-secondary/20 rounded-xl border border-dashed border-border/50 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-foreground">Need More Data</p>
                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">At least 2 consultations tracking "{selectedMetric}" are needed to build a visual trajectory.</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Patient Records" className="max-w-4xl">
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
            
            <div className="space-y-4 md:pr-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal
              </h3>
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input required value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={editForm.date_of_birth} onChange={handleDobChange} />
                  <p className="text-xs text-muted-foreground mt-1 text-right">Age: {editForm.age}</p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input 
                  value={editForm.phone} 
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 10) val = val.slice(0, 10);
                    setEditForm({...editForm, phone: val});
                  }} 
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input value={editForm.job} onChange={e => setEditForm({...editForm, job: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 md:pl-8 pt-6 md:pt-0">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Medical Data
              </h3>
              <div>
                <Label>Diagnosis</Label>
                <Input value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} />
              </div>
              <div>
                <Label>Medications</Label>
                <Input value={editForm.medications} onChange={e => setEditForm({...editForm, medications: e.target.value})} />
              </div>
              <div>
                <Label>Clinical History</Label>
                <Textarea className="h-32" value={editForm.medical_history} onChange={e => setEditForm({...editForm, medical_history: e.target.value})} />
              </div>
            </div>
            
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updatePatient.isPending} className="px-8">
              {updatePatient.isPending ? "Saving..." : "Save Secure File"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
