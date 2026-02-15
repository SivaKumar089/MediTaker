import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/common/Layout";
import Landing from "./components/common/Landing";
// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// Dashboards
import CaretakerDashboard from "./pages/caretaker/Dashboard";
import Inventory from "./pages/caretaker/Inventory";
import PatientRequests from "./pages/caretaker/PatientRequests";
import Patients from "./pages/caretaker/Patients";
import PatientDetails from "./pages/caretaker/PatientDetails";
import FindPatients from "./pages/caretaker/FindPatients";
import PatientDashboard from "./pages/patient/Dashboard";
import FindCaretakers from "./pages/patient/FindCaretakers";
import CaretakerRequests from "./pages/patient/CaretakerRequests";
import CheckIn from "./pages/patient/CheckIn";
import CalendarPage from "./pages/patient/CalendarPage";
import PatientMedicines from "./pages/patient/PatientMedicines";
import Profile from "./pages/common/Profile";
import Messages from "./pages/common/Messages";
import HealthRecords from "./pages/patient/HealthRecords";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />

          {/* Caretaker Auth */}
          <Route path="/caretaker/login" element={<Login role="caretaker" />} />
          <Route path="/caretaker/signup" element={<Signup role="caretaker" />} />

          {/* Patient Auth */}
          <Route path="/patient/login" element={<Login role="patient" />} />
          <Route path="/patient/signup" element={<Signup role="patient" />} />

          {/* Protected Caretaker Routes */}
          <Route
            path="/caretaker/*"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <Layout role="caretaker">
                  <Routes>
                    <Route path="dashboard" element={<CaretakerDashboard />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="requests" element={<PatientRequests />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:id" element={<PatientDetails />} />
                    <Route path="find-patients" element={<FindPatients />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="messages/:contactId" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Protected Patient Routes */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute requiredRole="patient">
                <Layout role="patient">
                  <Routes>
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="caretakers" element={<FindCaretakers />} />
                    <Route path="requests" element={<CaretakerRequests />} />
                    <Route path="medicines" element={<PatientMedicines />} />
                    <Route path="checkin" element={<CheckIn />} />
                    <Route path="health" element={<HealthRecords />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="messages/:contactId" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
