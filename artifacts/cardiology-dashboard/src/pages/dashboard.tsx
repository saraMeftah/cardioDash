import React from 'react';
import { Link } from 'wouter';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { usePatients } from '@/hooks/use-patients';
import { Card, Badge, Skeleton } from '@/components/ui';
import {
  Users, Calendar, Activity, CheckCircle, Clock,
  FileText, AlertTriangle, Heart, TrendingUp, ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const weekData = [
  { name: 'Mon', patients: 4, appointments: 6 },
  { name: 'Tue', patients: 7, appointments: 9 },
  { name: 'Wed', patients: 5, appointments: 7 },
  { name: 'Thu', patients: 9, appointments: 12 },
  { name: 'Fri', patients: 6, appointments: 8 },
  { name: 'Sat', patients: 3, appointments: 4 },
  { name: 'Sun', patients: 2, appointments: 3 },
];

function EcgBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-6 md:p-8">
      {/* ECG Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
      >
        <polyline
          points="0,40 40,40 55,40 65,8 75,72 85,40 110,40 140,40 155,15 165,65 175,40 220,40 250,40 265,20 275,60 285,40 350,40 380,40 395,12 405,68 415,40 460,40 520,40 535,18 545,62 555,40 600,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="ecg-line"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <Heart className="h-5 w-5 text-red-300 fill-red-300" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 pulse-ring" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/60">Live Monitor</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
          </h1>
          <p className="text-primary-foreground/60 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Cardiology Department
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/10 text-center">
            <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">Heart Rate</p>
            <p className="text-xl font-bold flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-300 fill-red-300" /> 72 bpm</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/10 text-center">
            <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">BP Avg</p>
            <p className="text-xl font-bold">120/80</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: patients } = usePatients();

  const criticalPatients = (patients || []).filter(p => (p as any).is_critical);
  const recentPatients = (patients || []).slice(0, 4);

  const statCards = [
    {
      title: "Total Patients",
      value: stats?.total_patients || 0,
      icon: Users,
      color: "text-[hsl(213,70%,40%)]",
      bg: "bg-[hsl(213,70%,22%)]/10",
      trend: "+3 this week",
      trendUp: true,
    },
    {
      title: "Today's Appointments",
      value: stats?.appointments_today || 0,
      icon: Calendar,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: "Scheduled today",
      trendUp: true,
    },
    {
      title: "Pending",
      value: stats?.pending_appointments || 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: "Awaiting action",
      trendUp: false,
    },
    {
      title: "Critical Cases",
      value: criticalPatients.length,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      trend: criticalPatients.length > 0 ? "Needs attention" : "All stable",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      <EcgBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="p-5 hover:-translate-y-1 transition-transform duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <TrendingUp className={`h-3.5 w-3.5 ${stat.trendUp ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.title}</p>
                  <p className={`text-[10px] mt-1 ${stat.trendUp ? 'text-emerald-500' : 'text-muted-foreground'}`}>{stat.trend}</p>
                </Card>
              </motion.div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground">Patients & appointments over 7 days</p>
            </div>
            <Badge variant="teal" className="text-[10px]">Live</Badge>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="patients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(213,70%,22%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(213,70%,22%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="appts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(176,57%,44%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(176,57%,44%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="appointments" stroke="hsl(176,57%,44%)" strokeWidth={2.5} fill="url(#appts)" name="Appointments" dot={false} />
                <Area type="monotone" dataKey="patients" stroke="hsl(213,70%,35%)" strokeWidth={2.5} fill="url(#patients)" name="Patients" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-accent inline-block" /> Appointments
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-primary inline-block" /> Patients
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <h3 className="text-base font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/patients', icon: Users, label: 'Add New Patient', color: 'bg-primary/10 text-primary' },
              { href: '/appointments', icon: Calendar, label: 'Schedule Appointment', color: 'bg-accent/10 text-accent' },
              { href: '/records', icon: FileText, label: 'Upload Record', color: 'bg-emerald-500/10 text-emerald-600' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="block">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {criticalPatients.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-xs font-bold text-destructive">Critical Alerts</p>
              </div>
              {criticalPatients.map(p => (
                <Link key={p.id} href={`/patients/${p.id}`}>
                  <p className="text-xs text-destructive/80 hover:text-destructive cursor-pointer truncate">• {p.full_name}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Patients */}
      {recentPatients.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Recent Patients</h3>
            <Link href="/patients">
              <span className="text-xs text-accent font-semibold hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="text-left pb-3 pr-4">Patient</th>
                  <th className="text-left pb-3 pr-4">Card ID</th>
                  <th className="text-left pb-3 pr-4">Age / Gender</th>
                  <th className="text-left pb-3 pr-4">Diagnosis</th>
                  <th className="text-left pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentPatients.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="py-2.5 pr-4">
                      <Link href={`/patients/${p.id}`}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold group-hover:text-accent transition-colors">{p.full_name}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.card_id || '—'}</td>
                    <td className="py-2.5 pr-4 text-sm text-muted-foreground">{p.age}y · {p.gender}</td>
                    <td className="py-2.5 pr-4 text-sm max-w-[160px] truncate">{p.diagnosis || '—'}</td>
                    <td className="py-2.5">
                      {(p as any).is_critical
                        ? <Badge variant="destructive">Critical</Badge>
                        : <Badge variant="success">Stable</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
