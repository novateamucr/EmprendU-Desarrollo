import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QueryProvider from './context/QueryProvider';
import { Perfil } from './routes/Perfil';
import { EditarPerfil } from './routes/EditarPerfil';
import LandingPage from './routes/landing';
import { FeedEmprendimiento } from './routes/FeedEmpredimiento';

import './App.css';

function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} /> 
          <Route path="/" element={<Perfil />} />
          <Route path="landing" element={<LandingPage />} />
          <Route path="feed/emprendimiento" element={<FeedEmprendimiento />} />
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;