import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ensureSeeded } from './data/db';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Agenda } from './pages/Agenda/Agenda';
import { Prazos } from './pages/Prazos/Prazos';
import { ProcessosList } from './pages/Processos/ProcessosList';
import { ProcessoDetail } from './pages/Processos/ProcessoDetail';
import { ClientesList } from './pages/Clientes/ClientesList';
import { ClienteDetail } from './pages/Clientes/ClienteDetail';
import { Configuracoes } from './pages/Configuracoes/Configuracoes';
import { Exclusoes } from './pages/Exclusoes/Exclusoes';
import { ComingSoon } from './pages/ComingSoon/ComingSoon';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeeded().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b' }}>
        Carregando Jurídico Pitzi…
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/prazos" element={<Prazos />} />
          <Route path="/processos" element={<ProcessosList />} />
          <Route path="/processos/:id" element={<ProcessoDetail />} />
          <Route path="/clientes" element={<ClientesList />} />
          <Route path="/clientes/:id" element={<ClienteDetail />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/exclusoes" element={<Exclusoes />} />
          <Route path="/financeiro" element={<ComingSoon />} />
          <Route path="/crm" element={<ComingSoon />} />
          <Route path="/intimacoes" element={<ComingSoon />} />
          <Route path="/gerador-subsidios" element={<ComingSoon />} />
          <Route path="/gerador-cartas" element={<ComingSoon />} />
          <Route path="/ata" element={<ComingSoon />} />
          <Route path="/guia" element={<ComingSoon />} />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
