import React, { useMemo, useState } from 'react';
import { useRoute } from 'wouter';
import { format } from 'date-fns';
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceArea,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, AlertTriangle, CalendarDays, ChevronDown, ChevronUp, FlaskConical,
  Plus, Save, Trash2, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Badge, Button, Card, Input, Label, Select, Skeleton } from '@/components/ui';
import { usePatient } from '@/hooks/use-patients';
import { useBloodTestSessions, useCreateBloodTestSession } from '@/hooks/use-blood-tests';
import {
  DEFAULT_CARDIAC_TESTS, computeStatus,
  finalizeBloodTestResult, statusLabel, type BloodTestDraft,
} from '@/lib/blood-tests';
import type { BloodTestResult, BloodTestSession, BloodTestStatus } from '@/lib/supabase';

const emptyRow: BloodTestDraft = { test: '', value: 0, unit: '', refMin: null, refMax: null };

function statusVariant(status: BloodTestStatus): 'success' | 'warning' | 'destructive' | 'default' {
  if (status === 'normal') return 'success';
  if (status === 'high' || status === 'low') return 'destructive';
  return 'default';
}

function latestByTest(sessions: BloodTestSession[]) {
  const map = new Map<string, { result: BloodTestResult; date: string; previous?: BloodTestResult }>();
  [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(session => {
    session.results.forEach(result => {
      const current = map.get(result.test);
      map.set(result.test, { result, date: session.date, previous: current?.result });
    });
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function trendIcon(current: BloodTestResult, previous?: BloodTestResult) {
  if (!previous || current.value === previous.value) return <span className="text-muted-foreground text-lg leading-none">→</span>;
  if (current.value > previous.value) return <TrendingUp className="h-4 w-4 text-red-500" />;
  return <TrendingDown className="h-4 w-4 text-emerald-500" />;
}

export default function BloodTests() {
  const [, params] = useRoute('/patients/:id/blood-tests');
  const patientId = params?.id || '';
  const { data: patient, isLoading: patientLoading } = usePatient(patientId);
  const { data: sessions = [], isLoading } = useBloodTestSessions(patientId);
  const createSession = useCreateBloodTestSession();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clinic, setClinic] = useState('');
  const [rows, setRows] = useState<BloodTestDraft[]>([{ ...emptyRow }]);
  const [selectedTest, setSelectedTest] = useState('');
  const [comparisonDates, setComparisonDates] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allTests = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(session => session.results.forEach(result => names.add(result.test)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  React.useEffect(() => {
    if (!selectedTest && allTests.length > 0) setSelectedTest(allTests[0]);
  }, [allTests, selectedTest]);

  const selectedTimeline = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .flatMap(session => session.results
        .filter(result => result.test === selectedTest)
        .map(result => ({
          date: format(new Date(session.date), 'dd/MM/yyyy'),
          rawDate: session.date,
          value: result.value,
          refMin: result.refMin ?? undefined,
          refMax: result.refMax ?? undefined,
          unit: result.unit,
        })));
  }, [sessions, selectedTest]);

  const latest = selectedTimeline[selectedTimeline.length - 1];
  const chartDomain = useMemo(() => {
    const values = selectedTimeline.flatMap(point => [point.value, point.refMin, point.refMax].filter(v => typeof v === 'number') as number[]);
    if (values.length === 0) return ['auto', 'auto'] as any;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.2, 1);
    return [Math.max(0, min - pad), max + pad];
  }, [selectedTimeline]);

  const comparisonData = useMemo(() => {
    const selected = comparisonDates.length > 0 ? comparisonDates : sessions.slice(0, 2).map(s => s.date);
    return selected
      .map(dateKey => {
        const session = sessions.find(s => s.date === dateKey);
        const result = session?.results.find(r => r.test === selectedTest);
        return result ? { date: format(new Date(dateKey), 'dd/MM/yyyy'), value: result.value } : null;
      })
      .filter(Boolean) as Array<{ date: string; value: number }>;
  }, [comparisonDates, sessions, selectedTest]);

  const saveRows = (drafts: BloodTestDraft[]) => {
    const results = drafts.map(finalizeBloodTestResult).filter(Boolean) as BloodTestResult[];
    if (!patientId || results.length === 0) return;
    createSession.mutate({ patientId, date, clinic, entryMethod: 'manual', results, photo: null }, {
      onSuccess: () => {
        setRows([{ ...emptyRow }]);
        setClinic('');
      },
    });
  };

  const updateRow = (index: number, patch: Partial<BloodTestDraft>) => {
    setRows(current => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  };

  if (patientLoading) return <div className="p-12 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-accent" /> Bilans sanguins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patient?.full_name || 'Patient'} · saisie ouverte, extraction photo et suivi temporel
          </p>
        </div>
        <Badge variant="teal">{sessions.length} visites</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.2fr)] gap-5">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-accent" /> Saisie manuelle</h2>
                <p className="text-xs text-muted-foreground">Une session correspond a une visite.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setRows([...rows, { ...emptyRow }])}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Clinique</Label>
                <Input placeholder="Lab Hamdan" value={clinic} onChange={e => setClinic(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 rounded-xl border border-border/70 p-3">
                  <Input list="blood-test-defaults" className="col-span-12" placeholder="Nom du test" value={row.test} onChange={e => updateRow(index, { test: e.target.value })} />
                  <Input className="col-span-4" type="number" step="any" placeholder="Resultat" value={row.value ?? ''} onChange={e => updateRow(index, { value: Number(e.target.value) })} />
                  <Input className="col-span-3" placeholder="Unite" value={row.unit || ''} onChange={e => updateRow(index, { unit: e.target.value })} />
                  <Input className="col-span-2" type="number" step="any" placeholder="Min" value={row.refMin ?? ''} onChange={e => updateRow(index, { refMin: e.target.value === '' ? null : Number(e.target.value) })} />
                  <Input className="col-span-2" type="number" step="any" placeholder="Max" value={row.refMax ?? ''} onChange={e => updateRow(index, { refMax: e.target.value === '' ? null : Number(e.target.value) })} />
                  <Button className="col-span-1" type="button" size="icon" variant="ghost" onClick={() => setRows(rows.filter((_, i) => i !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <datalist id="blood-test-defaults">
              {DEFAULT_CARDIAC_TESTS.map(test => <option key={test.test} value={test.test}>{test.note}</option>)}
            </datalist>

            <Button className="w-full mt-4" disabled={createSession.isPending} onClick={() => saveRows(rows)}>
              <Save className="h-4 w-4 mr-2" /> Enregistrer la session
            </Button>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {isLoading ? Array(3).fill(0).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>) : latestByTest(sessions).slice(0, 6).map(([name, item]) => (
              <Card key={name} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold truncate">{name}</p>
                  <Badge variant={statusVariant(item.result.status)}>{statusLabel(item.result.status)}</Badge>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <p className="text-2xl font-display font-bold">{item.result.value}<span className="text-xs font-sans text-muted-foreground ml-1">{item.result.unit}</span></p>
                  {trendIcon(item.result, item.previous)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.date), 'dd/MM/yyyy')}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Evolution temporelle</h2>
                <p className="text-xs text-muted-foreground">Bande verte = intervalle de reference du dernier resultat.</p>
              </div>
              <Select value={selectedTest} onChange={e => setSelectedTest(e.target.value)} className="md:w-56">
                {allTests.length === 0 && <option>Aucun test</option>}
                {allTests.map(test => <option key={test} value={test}>{test}</option>)}
              </Select>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={selectedTimeline} margin={{ top: 10, right: 18, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={chartDomain} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  {latest?.refMin !== undefined && latest?.refMax !== undefined && (
                    <ReferenceArea y1={latest.refMin} y2={latest.refMax} fill="#22c55e" fillOpacity={0.13} />
                  )}
                  <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /> Comparaison</h2>
                <p className="text-xs text-muted-foreground">Choisir 2 dates ou plus pour comparer.</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setComparisonDates(current => current.includes(session.date) ? current.filter(d => d !== session.date) : [...current, session.date])}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${comparisonDates.includes(session.date) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                >
                  {format(new Date(session.date), 'dd/MM/yyyy')}
                </button>
              ))}
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold mb-4">Historique des sessions</h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="rounded-xl border border-border/70">
                  <button className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setExpanded({ ...expanded, [session.id]: !expanded[session.id] })}>
                    <div>
                      <p className="text-sm font-bold">{format(new Date(session.date), 'dd/MM/yyyy')} · {session.clinic || 'Clinique non precisee'}</p>
                      <p className="text-xs text-muted-foreground">{session.results.length} resultats · {session.entry_method === 'photo' ? 'photo' : 'manuel'}</p>
                    </div>
                    {expanded[session.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {expanded[session.id] && (
                    <div className="border-t border-border/60 px-4 py-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground">
                          <tr className="text-left"><th className="py-2">Test</th><th>Resultat</th><th>Reference</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {session.results.map((result, index) => (
                            <tr key={`${result.test}-${index}`} className="border-t border-border/40">
                              <td className="py-2 font-medium">{result.test}</td>
                              <td>{result.value} {result.unit}</td>
                              <td>{result.refMin ?? '-'} - {result.refMax ?? '-'}</td>
                              <td><Badge variant={statusVariant(computeStatus(result.value, result.refMin, result.refMax))}>{statusLabel(computeStatus(result.value, result.refMin, result.refMax))}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucun bilan enregistre.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
