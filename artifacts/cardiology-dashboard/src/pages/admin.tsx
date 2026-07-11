import React, { useState } from 'react';
import { useAllUsers, useUpdateUserRole, useDeleteUser, useRecentActivity, useCreateStaff } from '@/hooks/use-admin';
import { useAuth } from '@/lib/auth-context';
import { Card, Badge, Button, Input, Select, Skeleton, Modal, Label } from '@/components/ui';
import {
  ShieldCheck, Users, UserCheck, User as UserIcon,
  Search, Trash2, Edit2, Activity, Clock, RefreshCw,
  AlertTriangle, CheckCircle, PlusCircle, ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

function UserSkeleton() {
  return (
    <tr>
      <td colSpan={5} className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>
      </td>
    </tr>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50">
      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

export default function Admin() {
  const { profile } = useAuth();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: activity, isLoading: activityLoading, refetch } = useRecentActivity();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const createStaff = useCreateStaff();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'doctor' | 'assistant'>('all');
  const [editingUser, setEditingUser] = useState<{ id: string; role: 'admin' | 'doctor' | 'assistant' | 'guest'; name: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'assistant' });
  const [inviteError, setInviteError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-5 rounded-full bg-destructive/10 mb-5">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const filteredUsers = (users || []).filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAdmins = (users || []).filter(u => u.role === 'admin').length;
  const totalDoctors = (users || []).filter(u => u.role === 'doctor').length;

  const activityIcons: Record<string, React.ReactNode> = {
    patient: <UserIcon className="h-3.5 w-3.5 text-blue-500" />,
    appointment: <Clock className="h-3.5 w-3.5 text-accent" />,
    record: <Activity className="h-3.5 w-3.5 text-emerald-500" />,
  };

  const activityColors: Record<string, string> = {
    patient: 'bg-blue-500/10',
    appointment: 'bg-accent/10',
    record: 'bg-emerald-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" /> Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full system control and user management</p>
        </div>
        <Button className="font-semibold" onClick={() => { setShowInviteModal(true); setInviteError(''); }}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Could not delete user</p>
            <p className="mt-0.5 text-xs opacity-80">{deleteError}</p>
            {deleteError.includes('Failed to fetch') || deleteError.includes('404') || deleteError.includes('not found') ? (
              <p className="mt-1 text-xs font-medium">👉 The <code>delete-staff</code> Edge Function is not deployed yet. Run: <code>supabase functions deploy delete-staff</code></p>
            ) : null}
          </div>
          <button className="ml-auto text-xs underline" onClick={() => setDeleteError('')}>Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Admins', value: totalAdmins, icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Doctors', value: totalDoctors, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-2xl font-bold font-display">{usersLoading ? '—' : s.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Users Table */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select className="w-full sm:w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="assistant">Assistant</option>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {['User', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {usersLoading
                    ? Array(5).fill(0).map((_, i) => <UserSkeleton key={i} />)
                    : filteredUsers.length === 0
                      ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                            No users found.
                          </td>
                        </tr>
                      )
                      : filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                  {u.avatar_url
                                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                    : <span className="text-xs font-bold text-primary">
                                        {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </span>
                                  }
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{u.full_name || '—'}</p>
                                  {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={u.role === 'admin' ? 'navy' : u.role === 'assistant' ? 'warning' : 'teal'} className="capitalize">
                                {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Change role"
                                  onClick={() => setEditingUser({ id: u.id, role: u.role as any, name: u.full_name })}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                {u.id !== profile?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Remove user"
                                    disabled={deleteUser.isPending}
                                    onClick={() => {
                                      setDeleteError('');
                                      if (confirm(`Remove ${u.full_name} from the system? This cannot be undone.`)) {
                                        deleteUser.mutate(u.id, {
                                          onError: (err: any) => setDeleteError(err.message || 'Unknown error')
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {u.id === profile?.id && (
                                  <Badge variant="teal" className="text-[10px]">You</Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Activity Log */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Recent Activity</h3>
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-7 w-7" title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-0 max-h-[520px] overflow-y-auto pr-1">
            {activityLoading
              ? Array(8).fill(0).map((_, i) => <ActivitySkeleton key={i} />)
              : (activity || []).length === 0
                ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No recent activity
                  </div>
                )
                : (activity || []).map(event => (
                    <div key={event.id} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${activityColors[event.type] || 'bg-secondary'}`}>
                        {activityIcons[event.type] || <Activity className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">{event.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
            }
          </div>
        </Card>
      </div>

      {/* Edit Role Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Change User Role" size="sm">
        {editingUser && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Update the role for <strong>{editingUser.name}</strong>.</p>
            <div>
              <Label>Role</Label>
              <Select
                value={editingUser.role}
                onChange={e => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'doctor' | 'assistant' })}
              >
                <option value="doctor">Doctor</option>
                <option value="assistant">Assistant</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  updateRole.mutate({ id: editingUser.id, role: editingUser.role }, {
                    onSuccess: () => setEditingUser(null),
                  });
                }}
                disabled={updateRole.isPending}
              >
                {updateRole.isPending ? 'Saving...' : 'Save Change'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Secure Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteError(''); }} title="Add Staff Member" size="md">
        <form onSubmit={e => {
            e.preventDefault();
            setInviteError('');
            createStaff.mutate(newUser, {
               onSuccess: () => {
                 setShowInviteModal(false);
                 setNewUser({ email: '', password: '', full_name: '', role: 'assistant' });
               },
               onError: (err: any) => setInviteError(err.message)
            });
        }} className="space-y-4 py-2">
           {inviteError && (
             <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg space-y-1">
               <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Error</p>
               <p>{inviteError}</p>
               {(inviteError.includes('Failed to fetch') || inviteError.includes('404') || inviteError.includes('FunctionsHttpError') || inviteError.includes('not found')) && (
                 <p className="text-xs mt-1 font-medium border-t border-destructive/20 pt-1">
                   👉 The <code className="bg-destructive/10 px-1 rounded">create-staff</code> Edge Function is not deployed yet.<br />
                   Run in your terminal: <code className="bg-destructive/10 px-1 rounded">supabase functions deploy create-staff</code>
                 </p>
               )}
             </div>
           )}
           <div>
             <Label>Full Name</Label>
             <Input required value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="Dr. John Doe" />
           </div>
           <div>
             <Label>Email</Label>
             <Input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="doctor@clinic.com" />
           </div>
           <div>
             <Label>Secure Password</Label>
             <Input required type="password" minLength={12} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Min. 12 characters" />
             <p className="text-xs text-muted-foreground mt-1">Minimum 12 characters required.</p>
           </div>
           <div>
             <Label>Assign Role</Label>
             <Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
               <option value="assistant">Assistant</option>
               <option value="doctor">Doctor</option>
               <option value="admin">Admin</option>
             </Select>
           </div>
           <div className="pt-4 flex justify-end gap-2">
             <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
             <Button type="submit" disabled={createStaff.isPending}>
               {createStaff.isPending ? 'Creating Account...' : 'Create Account'}
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
