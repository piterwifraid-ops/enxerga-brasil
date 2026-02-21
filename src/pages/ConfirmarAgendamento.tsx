import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ── Tipos ── */
interface ClinicaData {
  nome: string;
  endereco: string;
  horario: string;
  tel: string;
}

/* ── Constantes ── */
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/* ── Slots simulados ── */
const slotsPorDia: Record<number, string[]> = {
  0: ['07:30','08:00','08:30','09:00','09:30','10:00','11:00','14:00','14:30','15:00','15:30','16:00','16:30'],
  1: ['07:30','08:00','09:00','09:30','10:30','11:00','14:00','14:30','16:00','16:30'],
  2: ['07:30','08:30','09:00','10:00','10:30','11:00','13:30','14:00','15:30','16:00','16:30'],
  3: ['08:00','09:00','09:30','10:00','11:00','13:30','14:30','15:00','16:30'],
  4: ['07:30','08:00','08:30','09:30','10:00','10:30','14:00','14:30','15:00','15:30'],
  5: ['07:30','08:00','09:00','10:00','11:00','14:30','15:00','16:00'],
  6: ['07:30','08:30','09:00','09:30','10:30','14:00','14:30','15:30','16:00','16:30'],
};

const lotadosPorDia: Record<number, string[]> = {
  0: ['08:00','10:00','14:30'],
  1: ['08:00','09:00','14:00'],
  2: ['09:00','10:30','15:30'],
  3: ['09:00','14:30'],
  4: ['08:30','10:00','14:30'],
  5: ['08:00','10:00'],
  6: ['08:30','10:30','15:30'],
};

/* ── Gerar próximos 7 dias úteis ── */
interface DiaDisponivel {
  diaSemana: string;
  diaNum: number;
  mes: string;
  dataFormatada: string;
  index: number;
}

function gerarDatasDisponiveis(): DiaDisponivel[] {
  const hoje = new Date();
  const datas: DiaDisponivel[] = [];
  let count = 0;
  const d = new Date(hoje);
  d.setDate(d.getDate() + 1);

  while (count < 7) {
    const diaSem = d.getDay();
    if (diaSem !== 0 && diaSem !== 6) {
      datas.push({
        diaSemana: DIAS_SEMANA[diaSem],
        diaNum: d.getDate(),
        mes: MESES[d.getMonth()],
        dataFormatada: `${DIAS_SEMANA[diaSem]}, ${d.getDate()} de ${MESES[d.getMonth()]}`,
        index: count,
      });
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return datas;
}

/* ── CSS Variables / Styles ── */
const vars = {
  azul: '#1351b4',
  azulCl: '#dbe8fb',
  escuro: '#071d41',
  verde: '#168821',
  amarelo: '#fffbe6',
  amBorda: '#f0c040',
  vermelho: '#b00020',
  vermCl: '#fdecea',
  cinza: '#f4f6fb',
  borda: '#dde3ef',
  texto: '#1a1a2e',
  muted: '#5a6275',
  branco: '#ffffff',
};

/* ── Componente ── */
const ConfirmarAgendamento: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const clinica: ClinicaData = useMemo(() => (location.state as { clinica?: ClinicaData })?.clinica || {
    nome: 'Clínica Oftalmológica Central',
    endereco: 'Av. Goiás, 1234 – Setor Central · Goiânia – GO · CEP 74000-000',
    horario: 'Segunda a sexta, 7h às 17h',
    tel: '(62) 3000-0000',
  }, [location.state]);

  const datas = useMemo(() => gerarDatasDisponiveis(), []);

  const [dataSelecionada, setDataSelecionada] = useState<DiaDisponivel | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);

  const slotsAtuais = useMemo(() => {
    if (!dataSelecionada) return [];
    const idx = dataSelecionada.index % 7;
    return (slotsPorDia[idx] || slotsPorDia[0]).map(h => ({
      hora: h,
      lotado: (lotadosPorDia[idx] || []).includes(h),
    }));
  }, [dataSelecionada]);

  const handleSelecionarData = useCallback((dia: DiaDisponivel) => {
    setDataSelecionada(dia);
    setHoraSelecionada(null);
  }, []);

  const handleSelecionarHora = useCallback((hora: string) => {
    setHoraSelecionada(hora);
  }, []);

  const handleConfirmar = useCallback(() => {
    const prot = 'ENX-' + Date.now().toString().slice(-8);
    navigate('/protocolo-agendamento', {
      state: {
        protocolo: prot,
        data: dataSelecionada?.dataFormatada || '',
        hora: horaSelecionada || '',
        clinicaNome: clinica.nome,
        clinicaEndereco: clinica.endereco,
        clinicaTel: clinica.tel,
      },
    });
  }, [navigate, dataSelecionada, horaSelecionada, clinica]);

  const mostrarResumo = !!dataSelecionada;
  const mostrarBotaoConfirmar = !!dataSelecionada && !!horaSelecionada;

  return (
    <div style={{ fontFamily: "'Rawline','Raleway',sans-serif", background: vars.cinza, color: vars.texto, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* BREADCRUMB */}
      <div style={{ background: vars.branco, borderBottom: `1px solid ${vars.borda}`, padding: '10px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 13, padding: 0, margin: 0 }}>
            <li><a href="#" style={{ color: vars.azul, textDecoration: 'none' }}>Ministério da Saúde</a></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              <a href="#" style={{ color: vars.azul, textDecoration: 'none' }}>Projeto Enxerga Brasil</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} style={{ color: vars.azul, textDecoration: 'none', cursor: 'pointer' }}>Encontrar clínica</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#555' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              Confirmar agendamento
            </li>
          </ol>
        </div>
      </div>

      {/* STEPPER */}
      <div style={{ background: vars.branco, borderBottom: `1px solid ${vars.borda}`, padding: '16px 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <StepItem num={1} label="Busca por CEP" status="feito" />
          <div style={{ flex: 1, height: 2, background: vars.verde, margin: '0 8px' }} />
          <StepItem num={2} label="Clínica selecionada" status="feito" />
          <div style={{ flex: 1, height: 2, background: vars.verde, margin: '0 8px' }} />
          <StepItem num={3} label="Confirmar agendamento" status="atual" />
          <div style={{ flex: 1, height: 2, background: vars.borda, margin: '0 8px' }} />
          <StepItem num={4} label="Agendamento confirmado" status="futuro" />
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: 860, margin: '28px auto', padding: '0 24px', flex: 1, width: '100%' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: vars.escuro, marginBottom: 6 }}>Confirmar agendamento</h1>
        <p style={{ fontSize: 14, color: vars.muted, marginBottom: 24, lineHeight: 1.6 }}>
          Revise as informações da clínica, selecione a data e o horário de sua preferência e confirme o agendamento.
        </p>

        {/* CARD CLÍNICA */}
        <Card titulo="Clínica selecionada">
          <div style={{ fontSize: 18, fontWeight: 700, color: vars.escuro, marginBottom: 4 }}>{clinica.nome}</div>
          <div style={{ fontSize: 14, color: vars.muted, marginBottom: 16, lineHeight: 1.55 }}>{clinica.endereco}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
            <InfoItem label="Telefone" value={clinica.tel} />
            <InfoItem label="Horário de funcionamento" value={clinica.horario} />
            <InfoItem label="Tipo de atendimento" value="Exame oftalmológico gratuito · SUS" />
            <div>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#aaa', fontWeight: 700, marginBottom: 3 }}>Localização</strong>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.nome + ' ' + clinica.endereco)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 600, color: vars.azul, textDecoration: 'none' }}
              >Ver no Google Maps</a>
            </div>
          </div>
        </Card>

        {/* CARD HORÁRIO */}
        <Card titulo="Escolha a data e o horário">
          <p style={{ fontSize: 15, fontWeight: 700, color: vars.escuro, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${vars.borda}` }}>
            Datas disponíveis
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {datas.map((dia) => (
              <button
                key={dia.index}
                onClick={() => handleSelecionarData(dia)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 16px', border: `2px solid ${dataSelecionada?.index === dia.index ? vars.azul : vars.borda}`,
                  borderRadius: 7, cursor: 'pointer',
                  background: dataSelecionada?.index === dia.index ? vars.azulCl : vars.branco,
                  fontFamily: "'Rawline','Raleway',sans-serif", minWidth: 72,
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <span style={{ fontSize: 11, color: vars.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{dia.diaSemana}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: dataSelecionada?.index === dia.index ? vars.azul : vars.escuro, lineHeight: 1.1 }}>{dia.diaNum}</span>
                <span style={{ fontSize: 11, color: vars.muted }}>{dia.mes}</span>
              </button>
            ))}
          </div>

          {dataSelecionada && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: vars.escuro, marginBottom: 10 }}>Horários disponíveis</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {slotsAtuais.map(({ hora, lotado }) => (
                  <button
                    key={hora}
                    onClick={() => !lotado && handleSelecionarHora(hora)}
                    disabled={lotado}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${horaSelecionada === hora ? vars.azul : vars.borda}`,
                      borderRadius: 5, fontSize: 14, fontWeight: 600,
                      cursor: lotado ? 'not-allowed' : 'pointer',
                      background: lotado ? vars.cinza : horaSelecionada === hora ? vars.azulCl : vars.branco,
                      fontFamily: "'Rawline','Raleway',sans-serif",
                      color: lotado ? '#bbb' : horaSelecionada === hora ? vars.azul : vars.escuro,
                      textDecoration: lotado ? 'line-through' : 'none',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >{hora}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: vars.muted, marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, border: `2px solid ${vars.azul}`, background: vars.azulCl }} /> Disponível
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, border: `2px solid ${vars.borda}`, background: vars.cinza }} /> Indisponível
                </span>
              </div>
            </>
          )}
        </Card>

        {/* RESUMO DO AGENDAMENTO */}
        {mostrarResumo && (
          <Card titulo="Resumo do agendamento">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <ResumoItem label="Clínica" value={clinica.nome} />
              <ResumoItem label="Data" value={dataSelecionada?.dataFormatada || '—'} />
              <ResumoItem label="Horário" value={horaSelecionada || '—'} />
              <ResumoItem label="Tipo" value="Exame oftalmológico" />
            </div>
          </Card>
        )}

        {/* BOTÃO CONFIRMAR */}
        {mostrarBotaoConfirmar && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={handleConfirmar}
              style={{
                width: '100%', background: vars.verde, color: 'white',
                border: 'none', borderRadius: 6, padding: 15,
                fontSize: 16, fontWeight: 700, fontFamily: "'Rawline','Raleway',sans-serif",
                cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d5e19')}
              onMouseLeave={e => (e.currentTarget.style.background = vars.verde)}
            >Confirmar agendamento</button>

            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
              Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD · Lei 13.709/2018).{' '}
              <a href="#" style={{ color: vars.azul, textDecoration: 'none' }}>Política de Privacidade</a>
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: vars.escuro, color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '14px 24px', fontSize: 12 }}>
        Projeto Enxerga Brasil · Ministério da Saúde · Governo Federal &nbsp;·&nbsp; 0800 000 0000
      </footer>

      {/* Keyframe animation */}
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 600px) {
          .step-label-text { display: none !important; }
        }
      `}</style>
    </div>
  );
};

/* ── Sub-componentes ── */

function StepItem({ num, label, status }: { num: number; label: string; status: 'feito' | 'atual' | 'futuro' }) {
  const bgMap = { feito: vars.verde, atual: vars.azul, futuro: vars.cinza };
  const colorMap = { feito: 'white', atual: 'white', futuro: '#aaa' };
  const labelColorMap = { feito: vars.verde, atual: vars.azul, futuro: '#aaa' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: status === 'futuro' && num === 4 ? 0 : undefined }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
        background: bgMap[status], color: colorMap[status],
        border: status === 'futuro' ? `2px solid ${vars.borda}` : 'none',
      }}>{status === 'feito' ? '✓' : num}</div>
      <span className="step-label-text" style={{ fontSize: 12, fontWeight: 600, color: labelColorMap[status] }}>{label}</span>
    </div>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: vars.branco, border: `1px solid ${vars.borda}`, borderRadius: 8, overflow: 'hidden', marginBottom: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ background: vars.azul, color: 'white', padding: '10px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{titulo}</div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#aaa', fontWeight: 700, marginBottom: 3 }}>{label}</strong>
      <span style={{ fontSize: 14, color: vars.escuro, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ResumoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: vars.cinza, borderRadius: 6, padding: '12px 14px' }}>
      <strong style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#aaa', marginBottom: 4 }}>{label}</strong>
      <span style={{ fontSize: 15, fontWeight: 700, color: vars.escuro }}>{value}</span>
    </div>
  );
}

export default ConfirmarAgendamento;
