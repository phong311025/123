import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';

// View modules
import { DashboardView } from './components/dashboard/DashboardView';
import { NewsWeeklyView } from './components/news/NewsWeeklyView';
import { CalendarView } from './components/calendar/CalendarView';
import { EventsView } from './components/events/EventsView';
import { CommunicationPlanView } from './components/plans/CommunicationPlanView';
import { ProgressTrackingView } from './components/progress/ProgressTrackingView';
import { MembersView } from './components/members/MembersView';
import { EvaluationView } from './components/evaluation/EvaluationView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  return (
    <MainLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />}
      {currentTab === 'news' && <NewsWeeklyView />}
      {currentTab === 'calendar' && <CalendarView />}
      {currentTab === 'events' && <EventsView onNavigateToPlan={() => setCurrentTab('plans')} />}
      {currentTab === 'plans' && <CommunicationPlanView />}
      {currentTab === 'tasks' && <ProgressTrackingView />}
      {currentTab === 'members' && <MembersView />}
      {currentTab === 'evaluation' && <EvaluationView />}
      {currentTab === 'reports' && <ReportsView />}
      {currentTab === 'audit' && <AuditLogsView />}
      {currentTab === 'settings' && <SettingsView />}
    </MainLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
