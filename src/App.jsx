import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SubscriptionProvider } from '@/lib/SubscriptionContext';
import { I18nProvider } from '@/lib/i18nContext';

// Pages
import Landing from '@/pages/Landing.jsx';
import Onboarding from '@/pages/Onboarding';
import Today from '@/pages/Today';
import Nutrition from '@/pages/Nutrition';
import Workouts from '@/pages/Workouts';
import Routines from '@/pages/Routines';
import Protocols from '@/pages/Protocols';
import Measurements from '@/pages/Measurements';
import LabExams from '@/pages/LabExams';
import AtlasAI from '@/pages/AtlasAI';
import Profile from '@/pages/Profile';
import Export from '@/pages/Export';
import AdminPanel from '@/pages/AdminPanel';
import MyDiet from '@/pages/MyDiet';
import MyWorkout from '@/pages/MyWorkout';
import Diary from '@/pages/Diary';
import ProgressPhotos from '@/pages/ProgressPhotos';
import Social from '@/pages/Social';
import MyPrescribedDiet from '@/pages/MyPrescribedDiet';
import Pricing from '@/pages/Pricing';
import MyPrescribedWorkout from '@/pages/MyPrescribedWorkout';
import CoachDashboard from '@/pages/coach/CoachDashboard';
import CoachStudents from '@/pages/coach/CoachStudents';
import CoachStudentProfile from '@/pages/coach/CoachStudentProfile';
import CoachPrescribeWorkout from '@/pages/coach/CoachPrescribeWorkout';
import ClinicianDashboard from '@/pages/clinician/ClinicianDashboardProfessional';
import ClinicianPatients from '@/pages/clinician/ClinicianPatients';
import ClinicianPatientProfile from '@/pages/clinician/ClinicianPatientProfile';
import NutritionistDashboard from '@/pages/nutritionist/NutritionistDashboard.jsx';
import NutritionistClients from '@/pages/nutritionist/NutritionistClients.jsx';
import NutritionistClientProfile from '@/pages/nutritionist/NutritionistClientProfile.jsx';
import NutritionistPrescribeDiet from '@/pages/nutritionist/NutritionistPrescribeDiet';
import Auth from '@/pages/Auth.jsx';
import Insights from '@/pages/Insights';
import Exercises from '@/pages/Exercises';
import ExerciseDetail from '@/pages/ExerciseDetail';
import Progress from '@/pages/Progress';
import HelpCenter from '@/pages/HelpCenter';
import UseCase from '@/pages/UseCase';
import GettingStartedGuide from '@/pages/guides/GettingStartedGuide';
import GitHubPRTracker from '@/pages/GitHubPRTracker';
import WorkoutLoggingGuide from '@/pages/guides/WorkoutLoggingGuide';
import PlanVsExecutionGuide from '@/pages/guides/PlanVsExecutionGuide';

// Layout
import AppLayout from '@/components/layout/AppLayout.jsx';

const ROLE_HOME = {
  athlete:      '/Today',
  coach:        '/coach-dashboard',
  nutritionist: '/nutritionist-dashboard',
  clinician:    '/clinician-dashboard',
  admin:        '/AdminPanel',
};

const AuthenticatedApp = () => {
  const { authError, user, isAuthenticated, authState } = useAuth();
  const location = useLocation();

  const needsLogin = authError?.type === 'auth_required';

  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="w-8 h-8 border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;
  if (needsLogin) {
    const nextUrl = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;

    if (location.pathname !== '/auth') {
      return (
        <Navigate
          to={`/auth?mode=login&next=${encodeURIComponent(nextUrl)}`}
          replace
        />
      );
    }

    return <Auth />;
  }

  const homeRoute = isAuthenticated && user
    ? (ROLE_HOME[user.atlas_role] || '/Today')
    : '/Landing';

  return (
    <Routes>
      {/* Root redirect — role-aware */}
      <Route path="/" element={<Navigate to={homeRoute} replace />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="/landing" element={<Navigate to="/Landing" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      {/* Lowercase aliases to prevent 404 on case mismatch */}
      <Route path="/today" element={<Navigate to="/Today" replace />} />
      <Route path="/onboarding" element={<Navigate to="/Onboarding" replace />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/use-case/:role" element={<UseCase />} />
      <Route path="/guides/getting-started" element={<GettingStartedGuide />} />
      <Route path="/guides/workout-logging" element={<WorkoutLoggingGuide />} />
      <Route path="/guides/plan-vs-execution" element={<PlanVsExecutionGuide />} />

      {/* App (with sidebar layout) */}
      <Route element={<AppLayout />}>
        <Route path="/Today" element={<Today />} />
        <Route path="/Nutrition" element={<Nutrition />} />
        <Route path="/Workouts" element={<Workouts />} />
        <Route path="/Routines" element={<Routines />} />
        <Route path="/Protocols" element={<Protocols />} />
        <Route path="/Measurements" element={<Measurements />} />
        <Route path="/LabExams" element={<LabExams />} />
        <Route path="/AtlasAI" element={<AtlasAI />} />
        <Route path="/Insights" element={<Insights />} />
        <Route path="/Exercises" element={<Exercises />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/Progress" element={<Progress />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Export" element={<Export />} />
        <Route path="/AdminPanel" element={<AdminPanel />} />
        <Route path="/my-diet" element={<MyDiet />} />
        <Route path="/my-workout" element={<MyWorkout />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/progress-photos" element={<ProgressPhotos />} />
        <Route path="/social" element={<Social />} />
        <Route path="/prescribed-diet" element={<MyPrescribedDiet />} />
        <Route path="/Pricing" element={<Pricing />} />
        <Route path="/prescribed-workout" element={<MyPrescribedWorkout />} />
        <Route path="/coach-dashboard" element={<CoachDashboard />} />
        <Route path="/coach/students" element={<CoachStudents />} />
        <Route path="/coach/student/:id" element={<CoachStudentProfile />} />
        <Route path="/coach/prescribe-workout/:studentId" element={<CoachPrescribeWorkout />} />
        <Route path="/nutritionist-dashboard" element={<NutritionistDashboard />} />
        <Route path="/nutritionist/clients" element={<NutritionistClients />} />
        <Route path="/nutritionist/client/:id" element={<NutritionistClientProfile />} />
        <Route path="/nutritionist/prescribe-diet/:clientId" element={<NutritionistPrescribeDiet />} />
        <Route path="/clinician-dashboard" element={<ClinicianDashboard />} />
        <Route path="/clinician/patients" element={<ClinicianPatients />} />
        <Route path="/clinician/patient/:id" element={<ClinicianPatientProfile />} />
        <Route path="/github-prs" element={<GitHubPRTracker />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
              <SubscriptionProvider>
                <Router>
                  <AuthenticatedApp />
                </Router>
                <Toaster />
              </SubscriptionProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
