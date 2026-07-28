import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import type { CanalVenda, Cliente } from '../../data/types';

export function ClienteFormModal({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [canalAquisicao, setCanalAquisicao] = useState<CanalVenda>('Direto');

  async function handleSave() {
    if (!nome.trim()) return;
    const cliente: Cliente = {
      id: newId(),
      nome: nome.trim(),
      cpf: cpf.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      canalAquisicao,
      createdAt: new Date().toISOString(),
    };
    await repos.clientes.create(cliente);
    onClose();
  }

  return (
    <Modal
      title="Novo cliente"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar cliente
          </button>
        </>
      }
    >
      <div className="field">
        <label>Nome</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label>CPF</label>
          <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        </div>
        <div className="field">
          <label>Telefone</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>E-mail</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Canal de aquisição</label>
          <select className="select" value={canalAquisicao} onChange={(e) => setCanalAquisicao(e.target.value as CanalVenda)}>
            <option>Amazon</option>
            <option>Gazin</option>
            <option>PagBank</option>
            <option>Direto</option>
            <option>Outro</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
