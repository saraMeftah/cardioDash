import React from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/lib/auth-context';

import { AppLayout } from '@/components/layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Patients from '@/pages/patients';
import PatientProfile from '@/pages/patient-profile';
import Appointments from '@/pages/appointments';
import Records from '@/pages/records';
import Profile from '@/pages/profile';
import Admin from '@/pages/admin';
import Analytics from '@/pages/analytics';
import Prescriptions from '@/pages/prescriptions';
import BloodTests from '@/pages/blood-tests';
import RequestAppointment from '@/pages/request-appointment';
import ConfirmRequest from '@/pages/confirm-request';
import Requests from '@/pages/requests';
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <span className="text-3xl">🏗️</span>
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-2">This feature is coming soon.</p>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...props }: { component: React.ElementType; [key: string]: any }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = `${import.meta.env.BASE_URL}login`.replace('//', '/');
    return null;
  }

  return (
    <AppLayout>
      <Component {...props} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/request" component={RequestAppointment} />
      <Route path="/request/confirm/:id" component={ConfirmRequest} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/patients/:id/blood-tests" component={() => <ProtectedRoute component={BloodTests} />} />
      <Route path="/patients/:id" component={() => <ProtectedRoute component={PatientProfile} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
      <Route path="/requests" component={() => <ProtectedRoute component={Requests} />} />
      <Route path="/records" component={() => <ProtectedRoute component={Records} />} />
      <Route path="/prescriptions" component={() => <ProtectedRoute component={Prescriptions} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
