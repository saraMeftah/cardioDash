import React, { useState } from 'react';
import { useAnalyticsData } from '@/hooks/use-analytics';
import { Card, Badge, Skeleton } from '@/components/ui';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, Calendar, Heart, Activity, TrendingUp,
  CheckCircle, Clock, AlertCircle, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#0F2D55', '#2EC4B6', '#E63946', '#F4A261', '#A8DADC', '#457B9D', '#1D3557', '#6A994E'];
const STATUS_COLORS: Record<string, string> = {
  completed: '#2EC4B6',
  pending: '#F4A261',
  cancelled: '#E63946',
};

function StatCard({ title, value, sub, icon: Icon, color, bg, delay }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay || 0 }}>
      <Card className="p-5 hover:-translate-y-0.5 transition-transform duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">{title}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </Card>
    </motion.div>
  );
}

function ChartSkeleton({ h = 'h-56' }: { h?: string }) {
  return <Skeleton className={`w-full ${h} rounded-xl`} />;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data, isLoading } = useAnalyticsData();



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-accent" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Clinical insights and practice performance overview</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? Array(3).fill(0).map((_, i) => (
          <Card key={i} className="p-5"><Skeleton className="h-16 w-full" /></Card>
        )) : [
          { title: 'Total Patients', value: data?.totalPatients || 0, sub: 'All time', icon: Users, color: 'text-primary', bg: 'bg-primary/10', delay: 0 },
          { title: 'Total Appointments', value: data?.totalAppointments || 0, sub: 'All time', icon: Calendar, color: 'text-accent', bg: 'bg-accent/10', delay: 0.05 },
          { title: 'Completed', value: data?.completedAppointments || 0, sub: 'Appointments done', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', delay: 0.1 },
        ].map(s => <StatCard key={s.title} {...s} />)}
      </div>



      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patients over time */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold">New Patients — Last 12 Weeks</h3>
              <p className="text-xs text-muted-foreground">Patient registrations per week</p>
            </div>
            <Badge variant="navy" className="text-[10px]">Trend</Badge>
          </div>
          {isLoading ? <ChartSkeleton /> : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.patientsOverTime || []}>
                  <defs>
                    <linearGradient id="gPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F2D55" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F2D55" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="patients" name="Patients" stroke="#0F2D55" strokeWidth={2.5} fill="url(#gPatients)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Appointments over time */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold">Appointments — Last 14 Days</h3>
              <p className="text-xs text-muted-foreground">Daily appointment volume</p>
            </div>
            <Badge variant="teal" className="text-[10px]">Daily</Badge>
          </div>
          {isLoading ? <ChartSkeleton /> : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.appointmentsOverTime || []} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="appointments" name="Appointments" fill="#2EC4B6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appointment Status Pie */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">Appointment Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution of all appointments</p>
          {isLoading ? <ChartSkeleton h="h-48" /> : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.appointmentStatus || []}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(data?.appointmentStatus || []).map((entry: any, i: number) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v: string) => <span className="text-xs capitalize">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>



        {/* Diagnosis cloud */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">Top Diagnoses</h3>
          <p className="text-xs text-muted-foreground mb-4">Most common conditions in practice</p>
          {isLoading ? <ChartSkeleton h="h-48" /> : (
            <div className="h-48 overflow-y-auto space-y-2 pr-1">
              {(data?.diagDistribution || []).length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground text-center">No diagnoses recorded yet.<br />Add diagnoses to patients to see data here.</p>
                </div>
              ) : (
                (data?.diagDistribution || []).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs font-medium truncate max-w-[140px]">{d.name}</span>
                        <span className="text-xs font-bold text-muted-foreground ml-1">{d.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (d.value / (data?.totalPatients || 1)) * 100)}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Gender distribution */}
      {!isLoading && (data?.genderDistribution || []).length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-4">Gender Distribution</h3>
          <div className="flex gap-6 flex-wrap">
            {(data?.genderDistribution || []).map((g: any, i: number) => {
              const total = data?.totalPatients || 1;
              const pct = Math.round((g.value / total) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: COLORS[i] + '22' }}>
                    <Users className="h-5 w-5" style={{ color: COLORS[i] }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.value} patients · {pct}%</p>
                  </div>
                  <div className="ml-2 w-24 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
