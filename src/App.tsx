import { Routes, Route, Outlet, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { UserProvider } from './context/UserContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './components/layout/AuthLayout';
import { Layout } from './components/layout/Layout';

// Pages
import Home from './routes/Home';
import { Perfil } from './routes/Profile';
import { EditarPerfil } from './routes/EditarPerfil';
import LandingPage from './routes/Landing';
import { FeedEmprendimiento } from './routes/FeedEmpredimiento';
import BusinessFeedback from './routes/BusinessFeedback';
import Login from './routes/login';
import Register from './routes/register';
import Logout from './routes/logout';
import PwReset from './routes/pwReset';
import { Feed1 } from './routes/FeedCafeluna';

// Entrepreneur
import EntrepreneurManager from './routes/entrepreneur/EntrepreneurManager';
import Dashboard from './routes/entrepreneur/Dashboard';
import BusinessList from './routes/entrepreneur/components/BusinessList';
import BusinessSetup from './routes/entrepreneur/components/BusinessSetup';
import ProductInventory from './routes/entrepreneur/components/ProductInventory';

import NewPw from './routes/NewPw';
import GestorUsuarios from './routes/GestorUsuarios';
import { AñadirUsuario } from './routes/AñadirUsuario';

const queryClient = new QueryClient();

import './App.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <BusinessProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/landing" element={<LandingPage />} />
                
                {/* Auth routes with AuthLayout */}
                <Route element={<AuthLayout><Outlet /></AuthLayout>}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pwReset" element={<PwReset />} />
                  <Route path="/newPw" element={<NewPw />} />
                </Route>

                {/* ===========================================
                    ROUTE ACCESS GUIDE:
                    - allowedRoles: Array of role IDs that can access these routes
                      * 1 = Client
                      * 2 = Entrepreneur
                      * 3 = Admin
                =========================================== */}

                {/* Client & Entrepreneur Routes (Roles 1 & 2) */}
                <Route element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }>
                  {/* These routes are accessible to both clients and entrepreneurs */}
                  <Route index element={<Home />} />
                  <Route path="/profile" element={<Perfil />} />
                  <Route path="/perfil/editar/:id" element={<EditarPerfil />} />
                  <Route path="/feed/emprendimiento" element={<FeedEmprendimiento />} />
                  <Route path="/feed/emprendimiento/1" element={<Feed1 />} />
                  <Route path="/businessFeedback" element={<BusinessFeedback />} />
                  <Route path="/logout" element={<Logout />} />
                </Route>

                {/* ===========================================
                    ADMIN ROUTES (Role 3 only)
                    These routes are only accessible to admins
                =========================================== */}
                <Route path="/gestor-usuarios" element={
                  <ProtectedRoute allowedRoles={[3]}>
                    <Layout>
                      <GestorUsuarios />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/añadir-usuario" element={
                  <ProtectedRoute allowedRoles={[3]}>
                    <Layout>
                      <AñadirUsuario />
                    </Layout>
                  </ProtectedRoute>
                } />
                                {/* Unauthorized route */}
                <Route path="/unauthorized" element={
                  <div className="flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso no autorizado</h1>
                    <p className="mb-4">No tienes permiso para acceder a esta página.</p>
                    <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
                  </div>
                } />

                {/* ===========================================
                    ENTREPRENEUR ROUTES (Role 2 only)
                    These routes are only accessible to entrepreneurs
                =========================================== */}
                <Route element={
                  <ProtectedRoute allowedRoles={[2]} redirectTo="/unauthorized">
                    <Layout>
                      <EntrepreneurManager />
                    </Layout>
                  </ProtectedRoute>
                }>
                  <Route path="/entrepreneur" element={<Dashboard />} />
                  <Route path="/entrepreneur/businesses" element={<BusinessList />} />
                  <Route path="/entrepreneur/businesses/new" element={<BusinessSetup />} />
                  <Route path="businesses/:id/edit" element={<BusinessSetup />} />
                  <Route path="inventory" element={<ProductInventory />} />
                </Route>

                {/* Redirect root to landing or home based on auth status */}
                <Route path="/" element={<LandingPage />} />
              </Routes>
            </BusinessProvider>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

export default App;