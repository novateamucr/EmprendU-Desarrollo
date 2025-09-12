import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QueryProvider from './context/QueryProvider';
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
import NewPw from './routes/NewPw';
import GestorUsuarios from './routes/GestorUsuarios';
import { AñadirUsuario } from './routes/AñadirUsuario';

import './App.css';


function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} /> 
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/feed/emprendimiento" element={<FeedEmprendimiento />} />
          <Route path="/businessFeedback" element={<BusinessFeedback/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/pwReset" element={<PwReset />} />
          <Route path="/newPw" element={<NewPw />} />
          <Route path="/gestor-usuarios" element={<GestorUsuarios />} />
          <Route path="/añadir-usuario" element={<AñadirUsuario />} />

        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;