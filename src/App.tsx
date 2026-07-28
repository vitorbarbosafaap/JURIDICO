import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ensureSeeded } from './data/db';
import { applyBackendSettings } from './data/bootstrapBackend';
import { AuthGate } from './auth/AuthGate';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Agenda } from './pages/Agenda/Agenda';
import { Prazos } from './pages/Prazos/Prazos';
import { ProcessosList } from './pages/Processos/ProcessosList';
import { ProcessoDetail } from './pages/Processos/ProcessoDetail';
import { ClientesList } from './pages/Clientes/ClientesList';
import { ClienteDetail } from './pages/Clientes/ClienteDetail';
import { Configuracoes } from './pages/Configuracoes/Configuracoes';
import { Exclusoes } from './pages/Exclusoes/Exclusoes';
import { GeradorSubsidios } from './pages/GeradorSubsidios/GeradorSubsidios';
import { GeradorCartas } from './pages/GeradorCartas/GeradorCartas';
import { Intimacoes } from './pages/Intimacoes/Intimacoes';
import { CRM } from './pages/CRM/CRM';
import { AtaReuniaoList } from './pages/AtaReuniao/AtaReuniaoList';
import { AtaReuniaoDetail } from './pages/AtaReuniao/AtaReuniaoDetail';
import { Financeiro } from './pages/Financeiro/Financeiro';
import { Compliance } from './pages/Compliance/Compliance';
import { Auditoria } from './pages/Auditoria/Auditoria';
import { ComingSoon } from './pages/ComingSoon/ComingSoon';

export default function App() {
  const [backendReady, setBackendReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyBackendSettings().then(() => setBackendReady(true));
  }, []);

  useEffect(() => {
    if (!backendReady) return;
    ensureSeeded().then(() => setReady(true));
  }, [backendReady]);

  if (!backendReady) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b' }}>
        Inicializando…
      </div>
    );
  }

  return (
    <AuthGate>
      {!ready ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b' }}>
          Carregando Jurídico Pitzi…
        </div>
      ) : (
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
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/intimacoes" element={<Intimacoes />} />
              <Route path="/gerador-subsidios" element={<GeradorSubsidios />} />
              <Route path="/gerador-cartas" element={<GeradorCartas />} />
              <Route path="/ata" element={<AtaReuniaoList />} />
              <Route path="/ata/:id" element={<AtaReuniaoDetail />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/guia" element={<ComingSoon />} />
              <Route path="*" element={<ComingSoon />} />
            </Route>
          </Routes>
        </HashRouter>
      )}
    </AuthGate>
  );
}
