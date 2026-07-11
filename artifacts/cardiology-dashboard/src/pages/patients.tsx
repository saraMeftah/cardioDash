import React, { useState } from 'react';
import { Link } from 'wouter';
import { usePatients, useCreatePatient, useDeletePatient } from '@/hooks/use-patients';
import { Button, Input, Card, Modal, Label, Select, Textarea } from '@/components/ui';
import { Search, Plus, User as UserIcon, Activity, Trash2, CreditCard, Phone, Briefcase, MapPin, HeartPulse } from 'lucide-react';

const EMPTY_FORM = {
  card_id: '',
  full_name: '',
  date_of_birth: '',
  age: '',
  gender: 'male',
  phone: '',
  job: '',
  address: '',
  medical_history: '',
  diagnosis: '',
  medications: '',
};

export default function Patients() {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: patients, isLoading } = usePatients(search, genderFilter);
  const createPatient = useCreatePatient();
  const deletePatient = useDeletePatient();

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    if (!dob) {
      setFormData({ ...formData, date_of_birth: '', age: '', card_id: '' });
      return;
    }
    
    // Calculate Age
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    
    setFormData({ 
      ...formData, 
      date_of_birth: dob, 
      age: age.toString(), 
      card_id: `HC-${dob.replace(/-/g, '')}`
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // keep only numbers
    if (val.length > 10) val = val.slice(0, 10); // limit 10
    setFormData({ ...formData, phone: val });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(
      { ...formData, age: formData.age ? parseInt(formData.age, 10) : 0 },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setFormData(EMPTY_FORM);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage patient records and profiles.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Patient
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or card ID..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="w-full sm:w-48"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
      </Card>

      {/* Patient List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : patients?.length === 0 ? (
        <Card className="py-16 text-center shadow-sm">
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No patients found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or add a new patient.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {patients?.map((patient) => (
            <Card key={patient.id} className="p-6 group relative overflow-hidden transition-all hover:shadow-md border-border/50">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 font-bold text-xl shadow-sm border border-primary/10">
                  {patient.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/patients/${patient.id}`} className="hover:text-primary transition-colors">
                    <h3 className="text-xl font-bold text-foreground truncate">{patient.full_name}</h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-muted-foreground">
                    <span className="bg-secondary px-2 py-0.5 rounded-md text-xs">{patient.age} yrs</span>
                    <span className="capitalize">{patient.gender}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    {patient.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{patient.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 p-4 bg-gradient-to-r from-secondary/40 to-transparent rounded-xl border border-secondary/50 flex flex-col gap-2">
                <div className="flex items-start gap-2.5 text-sm">
                  <HeartPulse className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium line-clamp-1">{patient.diagnosis || 'No active diagnosis'}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href={`/patients/${patient.id}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-card hover:bg-secondary/50">Full Profile</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground px-4"
                  onClick={() => {
                    if (confirm(`Delete ${patient.full_name}? This cannot be undone.`)) {
                      deletePatient.mutate(patient.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Patient Registration" className="max-w-6xl w-[95vw] h-[85vh]">
        <form onSubmit={handleAddSubmit} className="space-y-8 bg-card rounded-xl">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left Side: Personal Info */}
            <div className="bg-secondary/20 border border-border/50 rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground">Personal Information</h3>
                  <p className="text-xs text-muted-foreground">Basic demographics & contact</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Full Name *</Label>
                  <Input
                    required
                    placeholder="e.g. John Smith"
                    className="mt-1"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date of Birth *</Label>
                    <Input
                      type="date"
                      required
                      className="mt-1"
                      value={formData.date_of_birth}
                      onChange={handleDobChange}
                    />
                    <div className="h-4 mt-1 text-right">
                      {formData.age && <span className="text-xs font-medium text-primary">Age: {formData.age} years</span>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gender *</Label>
                    <Select className="mt-1" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Phone (10 Digits)</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="5555555555"
                        className="pl-9 font-mono"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Occupation / Job</Label>
                    <div className="relative mt-1">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Teacher"
                        className="pl-9"
                        value={formData.job}
                        onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Home Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="123 Health St, City, State"
                      className="pl-9"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Medical File */}
            <div className="bg-secondary/20 border border-border/50 rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-2">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground">Clinical File</h3>
                  <p className="text-xs text-muted-foreground">Initial assessment and history</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Primary Diagnosis (Optional)</Label>
                  <Input
                    placeholder="e.g. Hypertension, Atrial Fibrillation"
                    className="mt-1 border-primary/20 focus:border-primary"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Medications (Optional)</Label>
                  <Textarea
                    placeholder="e.g. Aspirin 81mg daily..."
                    className="mt-1 h-20"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Medical History & General Notes</Label>
                  <Textarea
                    placeholder="Past surgeries, chronic conditions, family history, allergies..."
                    className="mt-1 h-36"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {createPatient.isError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-4 flex items-start gap-3">
              <div className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">!</div>
              <p className="text-sm text-red-500 font-medium">
                {(createPatient.error as Error)?.message || 'Failed to save patient. Please try again.'}
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3 border-t border-border mt-8">
            <Button type="button" variant="ghost" className="px-6" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createPatient.isPending} className="px-10 font-bold bg-primary hover:bg-primary/90">
              {createPatient.isPending ? 'Registering...' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
