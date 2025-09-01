import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QueryProvider from './context/QueryProvider';
import { Perfil } from './routes/Perfil';
import { EditarPerfil } from './routes/EditarPerfil';
import './App.css';

function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} /> 
          <Route path="/" element={<Perfil />} />
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;