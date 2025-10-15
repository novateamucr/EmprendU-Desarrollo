import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { UserProvider } from './context/UserContext';
import { FairsProvider } from './context/FairsContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';
import { Layout } from './components/layout/Layout';
import LandingPage from './routes/Landing';
import { FeedEmpredimientoDetalle } from './routes/FeedEmpredimientoDetalle';
import BusinessFeedback from './routes/BusinessFeedback';
import Home from './routes/Home';
import { Perfil } from './routes/Profile';
import { EditarPerfil } from './routes/EditarPerfil';
import Login from './routes/login';
import Register from './routes/register';
import Logout from './routes/logout';
import PwReset from './routes/pwReset';
import NewPw from './routes/NewPw';
import FeriasPage from './routes/Ferias';
import FeriasActividades from './routes/FeriasAvtividades';
import GestorUsuarios from './routes/GestorUsuarios';
import { AñadirUsuario } from './routes/AñadirUsuario';
import AñadirEmprendimiento from './routes/AñadirEmprendimiento';
import { CartProvider } from './context/CartContext';
import Cart from './routes/Cart';
import CartDetail from './routes/CartDetail';
import ProductDetail from './routes/ProductDetail';
import MyOrders from './routes/MyOrders';
import MyOrderDetail from './routes/MyOrderDetail';
import AdminDashB from './routes/AdminDashB';
import FAQs from './routes/FAQs';
import ContactUs from './routes/ContactUs';

// Entrepreneur
import EntrepreneurManager from './routes/entrepreneur/EntrepreneurManager';
import Dashboard from './routes/entrepreneur/Dashboard';
import BusinessList from './routes/entrepreneur/components/BusinessList';
import BusinessSetup from './routes/entrepreneur/components/BusinessSetup';
import InventoryPage from './routes/entrepreneur/inventory/InventoryPage';

const queryClient = new QueryClient();

import './App.css';
import GestorEmprendimientos from './routes/GestorEmprendimientos';

function RootRoute() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated === undefined) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <BusinessProvider>
            <CartProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/password-reset" element={<PwReset />} />
                <Route path="/new-password" element={<NewPw />} />
                <Route path="/FAQs" element={<FAQs />} />
                <Route path="/contactUs" element={<ContactUs />} />

                {/* Protected Routes */}
                <Route element={
                  <ProtectedRoute>
                    <FairsProvider>
                    <Layout>
                      <Outlet />
                    </Layout>
                    </FairsProvider>
                  </ProtectedRoute>
                }>
                  {/* Public Routes */}
                  <Route path="/home" element={<Home />} />
                  <Route path="/business/:id" element={<FeedEmpredimientoDetalle />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/ferias" element={<FeriasPage />} />
                  <Route path="/ferias/actividades" element={<FeriasActividades />} />

                  
                  {/* Regular User Routes (role 1) */}
                  <Route element={<RoleBasedRoute allowedRoles={[1, 2, 3]}> <Outlet /> </RoleBasedRoute>}>
                    <Route path="/profile" element={<Perfil />} />
                    <Route path="/profile/edit" element={<EditarPerfil />} />
                    <Route path="/orders" element={<MyOrders />} />
                    <Route path="/orders/:id" element={<MyOrderDetail />} />
                    <Route path="/feedback" element={<BusinessFeedback />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/cart/detail" element={<CartDetail />} />
                  </Route>
                  
                  {/* Admin Routes (role 3) */}
                  <Route element={<RoleBasedRoute allowedRoles={[3]} redirectTo="/home"> <Outlet /> </RoleBasedRoute>}>
                    <Route path="/admin/usuarios" element={<GestorUsuarios />} />
                    <Route path="/admin/usuarios/nuevo" element={<AñadirUsuario />} />
                    <Route path="/admin/emprendimientos" element={<GestorEmprendimientos />} />
                    <Route path="/admin/emprendimientos/nuevo" element={<AñadirEmprendimiento />} />
                    <Route path="/admin/emprendimientos/nuevo/:id" element={<AñadirEmprendimiento />} />
                    <Route path="/admin/dashboard" element={<AdminDashB />} />
                    <Route path="/profile/edit/:id" element={<EditarPerfil />} />
                  </Route>

                  {/* Entrepreneur Routes (role 2) */}
                  <Route element={<RoleBasedRoute allowedRoles={[2]} redirectTo="/home"> <Outlet /> </RoleBasedRoute>}>
                    <Route path="/entrepreneur" element={<EntrepreneurManager />}>
                      <Route index element={<Dashboard />} />
                      <Route path="businesses" element={<BusinessList />} />
                      <Route path="business/setup" element={<BusinessSetup />} />
                      <Route path="inventory" element={<InventoryPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* Logout */}
                <Route path="/logout" element={<Logout />} />

                {/* 404 - Not Found */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="flex flex-col items-center justify-center h-screen">
                        <h1 className="text-4xl font-bold mb-4">404</h1>
                        <p className="text-xl">Página no encontrada</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </CartProvider>
          </BusinessProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
