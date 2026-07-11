import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Label } from '@/components/ui';
import { User, Phone, Camera, Save, Shield, Calendar, Briefcase, MapPin, Lock, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    specialty: profile?.specialty || '',
    address: profile?.address || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Email change
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  // Password change
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let avatar_url = profile?.avatar_url;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw new Error('Failed to upload photo: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = urlData.publicUrl + `?t=${Date.now()}`;
        setIsUploadingAvatar(false);
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: formData.full_name, 
          phone: formData.phone,
          specialty: formData.specialty,
          address: formData.address,
          avatar_url 
        })
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      await refreshProfile();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsSavingEmail(true);
    setEmailSuccessMsg('');
    setEmailErrorMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw new Error(error.message);
      setEmailSuccessMsg('Confirmation email sent! Check your inbox to verify the new address.');
      setTimeout(() => setEmailSuccessMsg(''), 6000);
    } catch (err) {
      setEmailErrorMsg((err as Error).message || 'Failed to update email.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrorMsg('Passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordErrorMsg('Password must be at least 8 characters.');
      return;
    }
    setIsSavingPassword(true);
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw new Error(error.message);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordSuccessMsg('Password updated successfully!');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err) {
      setPasswordErrorMsg((err as Error).message || 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and clinic configuration.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Section */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </Card>

        {/* Personal & Clinical Info */}
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile & Clinic Information
          </h2>
          <p className="text-sm text-muted-foreground mb-4">This information will appear on your printed Ordonnances.</p>

          <div>
            <Label>Full Name</Label>
            <Input
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Dr. Mohammed El Hadi"
            />
          </div>

          <div>
            <Label>Medical Specialty</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g. Spécialiste en Cardiologie"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 0555 XX XX XX"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Clinic Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Cité 11 Décembre, Alger"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">To change your email, use the <span className="font-medium">Change Email</span> section below.</p>
          </div>
        </Card>

        {/* Account Info (read-only) */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Account Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Role</p>
              <p className="font-semibold capitalize">{profile?.role || 'Doctor'}</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Member Since</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Feedback */}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isUploadingAvatar ? 'Uploading photo...' : isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* ── Email Change ─────────────────────────────────────────────── */}
      <form onSubmit={handleSaveEmail} className="space-y-4">
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Change Email
          </h2>
          <p className="text-sm text-muted-foreground">
            A confirmation link will be sent to the new address. Your email won't change until you click it.
          </p>
          <div>
            <Label>New Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="pl-10"
              />
            </div>
          </div>
          {emailSuccessMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              ✓ {emailSuccessMsg}
            </div>
          )}
          {emailErrorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
              {emailErrorMsg}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={isSavingEmail || newEmail === user?.email}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingEmail ? 'Sending...' : 'Update Email'}
            </Button>
          </div>
        </Card>
      </form>

      {/* ── Password Change ───────────────────────────────────────────── */}
      <form onSubmit={handleSavePassword} className="space-y-4">
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Change Password
          </h2>
          <div>
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Min. 8 characters"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                required
                minLength={8}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="pl-10"
              />
            </div>
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>
          {passwordSuccessMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              ✓ {passwordSuccessMsg}
            </div>
          )}
          {passwordErrorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
              {passwordErrorMsg}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="outline"
              disabled={isSavingPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
