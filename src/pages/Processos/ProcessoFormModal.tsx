import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import type { CanalVenda, Cliente, Contingencia, Escritorio, Processo, Seguradora, StatusProcesso, TipoDemanda } from '../../data/types';

interface Props {
  clientes: Cliente[];
  escritorios: Escritorio[];
  seguradoras: Seguradora[];
  onClose: () => void;
}

export function ProcessoFormModal({ clientes, escritorios, seguradoras, onClose }: Props) {
  const navigate = useNavigate();
  const [numeroCNJ, setNumeroCNJ] = useState('');
  const [tribunalVara, setTribunalVara] = useState('');
  const [tipoDemanda, setTipoDemanda] = useState<TipoDemanda>('Judicial');
  const [clienteId, setClienteId] = useState('');
  const [contingencia, setContingencia] = useState<Contingencia>('Possível');
  const [valorCausa, setValorCausa] = useState(0);
  const [escritorioResponsavelId, setEscritorioResponsavelId] = useState('');
  const [status, setStatus] = useState<StatusProcesso>('Novo');
  const [canalVenda, setCanalVenda] = useState<CanalVenda>('Direto');
  const [seguradoraId, setSeguradoraId] = useState('');
  const [produto, setProduto] = useState('Device Protection');

  async function handleSave() {
    const now = new Date().toISOString();
    const processo: Processo = {
      id: newId(),
      numeroCNJ: numeroCNJ.trim() || undefined,
      tribunalVara: tribunalVara.trim() || undefined,
      tipoDemanda,
      clienteId: clienteId || undefined,
      contingencia,
      valorCausa,
      escritorioResponsavelId: escritorioResponsavelId || undefined,
      status,
      canalVenda,
      produto: produto.trim() || undefined,
      seguradoraId: seguradoraId || undefined,
      createdAt: now,
      updatedAt: now,
      timeline: [{ id: newId(), at: now, texto: 'Processo cadastrado no sistema.' }],
      documentos: [],
      comunicacoes: [],
      financeiro: [],
      auditoria: [{ id: newId(), at: now, autor: 'Você', acao: 'Criação do processo' }],
    };
    await repos.processos.create(processo);
    onClose();
    navigate(`/processos/${processo.id}`);
  }

  return (
    <Modal
      title="Novo processo"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Criar processo
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="field">
          <label>Número CNJ</label>
          <input className="input" value={numeroCNJ} onChange={(e) => setNumeroCNJ(e.target.value)} />
        </div>
        <div className="field">
          <label>Tribunal / Vara</label>
          <input className="input" value={tribunalVara} onChange={(e) => setTribunalVara(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Tipo de demanda</label>
          <select className="select" value={tipoDemanda} onChange={(e) => setTipoDemanda(e.target.value as TipoDemanda)}>
            <option value="Judicial">Judicial</option>
            <option value="JEC">JEC</option>
            <option value="PROCON">PROCON</option>
            <option value="Sinistro">Sinistro</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as StatusProcesso)}>
            <option>Novo</option>
            <option>Aguardando subsídio</option>
            <option>Em defesa</option>
            <option>Aguardando audiência</option>
            <option>Concluído</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Cliente / reclamante</label>
        <select className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecionar cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Contingência</label>
          <select className="select" value={contingencia} onChange={(e) => setContingencia(e.target.value as Contingencia)}>
            <option>Provável</option>
            <option>Possível</option>
            <option>Remota</option>
          </select>
        </div>
        <div className="field">
          <label>Valor da causa / provisão (R$)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={valorCausa}
            onChange={(e) => setValorCausa(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Escritório responsável</label>
          <select
            className="select"
            value={escritorioResponsavelId}
            onChange={(e) => setEscritorioResponsavelId(e.target.value)}
          >
            <option value="">Selecionar</option>
            {escritorios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Seguradora / parceiro</label>
          <select className="select" value={seguradoraId} onChange={(e) => setSeguradoraId(e.target.value)}>
            <option value="">Nenhuma</option>
            {seguradoras.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Canal de venda</label>
          <select className="select" value={canalVenda} onChange={(e) => setCanalVenda(e.target.value as CanalVenda)}>
            <option>Amazon</option>
            <option>Gazin</option>
            <option>PagBank</option>
            <option>Direto</option>
            <option>Outro</option>
          </select>
        </div>
        <div className="field">
          <label>Produto</label>
          <input className="input" value={produto} onChange={(e) => setProduto(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
