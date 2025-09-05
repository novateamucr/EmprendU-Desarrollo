import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QueryProvider from './context/QueryProvider';
import { Perfil } from './routes/Perfil';
import { EditarPerfil } from './routes/EditarPerfil';
import LandingPage from './routes/Landing';
import { FeedEmprendimiento } from './routes/FeedEmpredimiento';
import Login from './routes/login';
import Register from './routes/register';
import PwReset from './routes/pwReset';

import './App.css';

function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Perfil />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} /> 
          <Route path="/" element={<Perfil />} />
          <Route path="landing" element={<LandingPage />} />
          <Route path="feed/emprendimiento" element={<FeedEmprendimiento />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pwReset" element={<PwReset />} />
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;