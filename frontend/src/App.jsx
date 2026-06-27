import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Debitur
import DebiturListPage from './pages/debitur/DebiturListPage';
import DebiturFormPage from './pages/debitur/DebiturFormPage';
import DebiturDetailPage from './pages/debitur/DebiturDetailPage';

// Pengajuan
import PengajuanListPage from './pages/pengajuan/PengajuanListPage';
import PengajuanFormPage from './pages/pengajuan/PengajuanFormPage';
import PengajuanDetailPage from './pages/pengajuan/PengajuanDetailPage';

// Survey
import SurveyListPage from './pages/survey/SurveyListPage';
import SurveyFormPage from './pages/survey/SurveyFormPage';

// SLIK
import SlikFormPage from './pages/slik/SlikFormPage';

// Agunan
import AgunanFormPage from './pages/agunan/AgunanFormPage';
import AgunanEditPage from './pages/agunan/AgunanEditPage';

// Analisa
import AnalisaKonsumtifPage from './pages/analisa/AnalisaKonsumtifPage';
import AnalisaProduktifPage from './pages/analisa/AnalisaProduktifPage';

// Scoring & Approval
import ScoringPage from './pages/scoring/ScoringPage';
import ApprovalListPage from './pages/approval/ApprovalListPage';

// Admin
import UserManagementPage from './pages/admin/UserManagementPage';

// MAK
import MakPreviewPage from './pages/mak/MakPreviewPage';
// Monitoring
import MonitoringPage from './pages/monitoring/MonitoringPage';
import MonitoringDetailPage from './pages/monitoring/MonitoringDetailPage';

// EWS
import EwsDashboardPage from './pages/ews/EwsDashboardPage';
import EwsDetailPage from './pages/ews/EwsDetailPage';
import AoVisitFormPage from './pages/ews/AoVisitFormPage';
// Audit
import AuditDashboardPage from './pages/audit/AuditDashboardPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Debitur */}
          <Route path="/debitur" element={<DebiturListPage />} />
          <Route path="/debitur/tambah" element={<DebiturFormPage />} />
          <Route path="/debitur/:id" element={<DebiturDetailPage />} />
          <Route path="/debitur/:id/edit" element={<DebiturFormPage />} />

          {/* Pengajuan */}
          <Route path="/pengajuan" element={<PengajuanListPage />} />
          <Route path="/pengajuan/tambah" element={<PengajuanFormPage />} />
          <Route path="/pengajuan/:id" element={<PengajuanDetailPage />} />

          {/* Survey */}
          <Route path="/survey" element={<SurveyListPage />} />
          <Route path="/survey/tambah" element={<SurveyFormPage />} />

          {/* SLIK */}
          <Route path="/slik" element={<SlikFormPage />} />

          {/* Agunan */}
          <Route path="/agunan" element={<AgunanFormPage />} />
          <Route path="/agunan/:id/edit" element={<AgunanEditPage />} />

          {/* Analisa */}
          <Route path="/analisa/konsumtif" element={<AnalisaKonsumtifPage />} />
          <Route path="/analisa/produktif" element={<AnalisaProduktifPage />} />

          {/* Scoring */}
          <Route path="/scoring" element={<ScoringPage />} />

          {/* Approval */}
          <Route path="/approval" element={<ApprovalListPage />} />

          {/* MAK */}
          <Route path="/mak/:pengajuanId" element={<MakPreviewPage />} />

          {/* Monitoring */}
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/monitoring/:id" element={<MonitoringDetailPage />} />

          {/* EWS */}
          <Route path="/ews" element={<EwsDashboardPage />} />
          <Route path="/ews/visit" element={<AoVisitFormPage />} />
          <Route path="/ews/:id" element={<EwsDetailPage />} />

          {/* Audit */}
          <Route path="/audit" element={<AuditDashboardPage />} />

          {/* Admin */}
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
    </>
  );
}
