import { NavLink } from 'react-router-dom';
import { NAV } from '../../nav';

interface Props {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: Props) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="mark">P</div>
          <div>
            <div className="name">Jurídico Pitzi</div>
            <div className="sub">Legal Ops · Leapfone</div>
          </div>
        </div>

        {NAV.map((group) => (
          <div className="nav-group" key={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              if (!item.implemented) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) => `nav-item soon ${isActive ? 'active' : ''}`}
                  >
                    <span className="icon">
                      <Icon size={16} />
                    </span>
                    {item.label}
                    <span className="tag-soon">Em breve</span>
                  </NavLink>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="icon">
                    <Icon size={16} />
                  </span>
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}

        <div className="sidebar-footer">
          Dados armazenados neste navegador (localStorage).
          <br />
          Fase 1 — MVP local.
        </div>
      </aside>
      <div className={`sidebar-scrim ${open ? 'open' : ''}`} onClick={onNavigate} />
    </>
  );
}
