import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QueryProvider from './context/QueryProvider';
import { BusinessProvider } from './context/BusinessContext';
import Home from './routes/Home';
import { Perfil } from './routes/Profile';
import { EditarPerfil } from './routes/EditarPerfil';
import LandingPage from './routes/Landing';
import { FeedEmprendimiento } from './routes/FeedEmpredimiento';
import BusinessFeedback  from './routes/BusinessFeedback';
import Login from './routes/login';
import Register from './routes/register';
import Logout from './routes/logout';
import PwReset from './routes/pwReset';

// Entrepreneur
import EntrepreneurManager from './routes/entrepreneur/EntrepreneurManager';
import Dashboard from './routes/entrepreneur/Dashboard';
import BusinessList from './routes/entrepreneur/components/BusinessList';
import BusinessSetup from './routes/entrepreneur/components/BusinessSetup';
import ProductInventory from './routes/entrepreneur/components/ProductInventory';

import NewPw from './routes/NewPw';

import GestorUsuarios from './routes/GestorUsuarios';
import { AñadirUsuario } from './routes/AñadirUsuario';

import './App.css';


function App() {
  return (
    <QueryProvider>
      <BusinessProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Perfil />} />
          <Route path="/perfil/editar/:id" element={<EditarPerfil />} /> 
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/feed/emprendimiento" element={<FeedEmprendimiento />} />
          <Route path="/businessFeedback" element={<BusinessFeedback/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/pwReset" element={<PwReset />} />

          
          {/* Entrepreneur Routes */}
          <Route path="/entrepreneur" element={<EntrepreneurManager />}>
            <Route index element={<Dashboard />} />
            <Route path="businesses" element={<BusinessList />} />
            <Route path="businesses/new" element={<BusinessSetup />} />
            <Route path="businesses/:id/edit" element={<BusinessSetup />} />
            <Route path="inventory" element={<ProductInventory />} />
            <Route path="*" element={<Navigate to="/entrepreneur" replace />} />
          </Route>

          <Route path="/newPw" element={<NewPw />} />

          <Route path="/gestor-usuarios" element={<GestorUsuarios />} />
          <Route path="/añadir-usuario" element={<AñadirUsuario />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </BusinessProvider>
    </QueryProvider>
  );
}

export default App;