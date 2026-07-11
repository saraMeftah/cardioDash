import React, { useState, useMemo } from 'react';
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus } from '@/hooks/use-appointments';
import { usePatients } from '@/hooks/use-patients';
import { Card, Button, Modal, Label, Input, Select, Badge } from '@/components/ui';
import { Calendar as CalendarIcon, Clock, Plus, Check, X, Play, Activity, Users, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Appointments() {
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const selectedDate = useMemo(() => new Date(selectedDateStr + 'T00:00:00'), [selectedDateStr]);

  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const { data: patients } = usePatients();
  const createApt = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    time: '09:00',
    notes: ''
  });

  // Calculate Daily Stats
  const waitingApts = appointments?.filter(a => a.status === 'pending') || [];
  const inProgressApts = appointments?.filter(a => a.status === 'in_progress') || [];
  const completedApts = appointments?.filter(a => a.status === 'completed') || [];
  
  let avgSeconds = 0;
  const aptsWithDuration = completedApts.filter(a => a.started_at && a.completed_at);
  if (aptsWithDuration.length > 0) {
    const totalDuration = aptsWithDuration.reduce((acc, apt) => {
      return acc + (new Date(apt.completed_at!).getTime() - new Date(apt.started_at!).getTime());
    }, 0);
    avgSeconds = totalDuration / aptsWithDuration.length / 1000;
  }
  const avgMins = Math.round(avgSeconds / 60);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${selectedDateStr}T${formData.time}`).toISOString();
    
    createApt.mutate({
      patient_id: formData.patient_id,
      date: dateTime,
      status: 'pending',
      notes: formData.notes
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setFormData({ ...formData, notes: '' });
      }
    });
  };

  const getDurationString = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return `${mins} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Daily Agenda</h1>
          <p className="text-muted-foreground mt-1">Manage and track your schedule for the day.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input 
            type="date" 
            value={selectedDateStr}
            onChange={(e) => setSelectedDateStr(e.target.value)}
            className="w-full md:w-48 bg-card"
          />
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Schedule
          </Button>
        </div>
      </div>

      {/* Tracker Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Waiting</p>
            <p className="text-2xl font-bold">{waitingApts.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Activity className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">In Session</p>
            <p className="text-2xl font-bold">{inProgressApts.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10">
            <Check className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{completedApts.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Clock className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Avg Time</p>
            <p className="text-2xl font-bold">{avgMins} <span className="text-sm font-normal text-muted-foreground">min</span></p>
          </div>
        </Card>
      </div>

      {/* Appointment List view */}
      {isLoading ? (
        <div className="py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
      ) : appointments?.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No appointments for {format(selectedDate, 'MMM do')}</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Enjoy your empty schedule, or click the button above to add a new appointment.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="p-4 font-semibold rounded-tl-xl">Time</th>
                  <th className="p-4 font-semibold">Patient</th>
                  <th className="p-4 font-semibold">Reason / Notes</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Tracker Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments?.map((apt) => (
                  <tr key={apt.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(apt.date), 'h:mm a')}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-primary">{apt.patients?.full_name}</td>
                    <td className="p-4 max-w-[200px] truncate text-muted-foreground">{apt.notes || '-'}</td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          apt.status === 'completed' ? 'success' : 
                          apt.status === 'in_progress' ? 'teal' : 
                          apt.status === 'pending' ? 'warning' : 'default'
                        }
                        className={apt.status === 'in_progress' ? 'animate-pulse' : ''}
                      >
                        {apt.status === 'in_progress' ? 'In Session' : apt.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {apt.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => updateStatus.mutate({ id: apt.id, status: 'in_progress' })}
                            disabled={updateStatus.isPending || inProgressApts.length > 0}
                            title={inProgressApts.length > 0 ? "Another patient is currently in session" : "Start Appointment"}
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Start
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => updateStatus.mutate({ id: apt.id, status: 'cancelled' })}
                            disabled={updateStatus.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {apt.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateStatus.mutate({ id: apt.id, status: 'completed' })}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Complete Visit
                        </Button>
                      )}

                      {apt.status === 'completed' && (
                        <div className="flex items-center justify-end gap-2 text-muted-foreground">
                          <span className="text-xs font-medium">Duration:</span>
                          <Badge variant="default" className="font-mono">
                            {getDurationString(apt.started_at, apt.completed_at)}
                          </Badge>
                        </div>
                      )}

                      {apt.status === 'cancelled' && (
                        <span className="text-xs text-muted-foreground font-medium">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Appointment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Schedule for Selected Day">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Select required value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}>
              <option value="">Select a patient...</option>
              {patients?.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Time ({format(selectedDate, 'MMM d, yyyy')})</Label>
            <Input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
          </div>
          <div>
            <Label>Reason for Visit / Notes</Label>
            <Input placeholder="E.g., Routine checkup, ECG..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createApt.isPending}>
              {createApt.isPending ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
