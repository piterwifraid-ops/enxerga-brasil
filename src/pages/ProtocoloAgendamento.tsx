import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/* ── Tipos ── */
interface AgendamentoData {
  protocolo: string;
  data: string;
  hora: string;
  clinicaNome: string;
  clinicaEndereco: string;
  clinicaTel: string;
  pacNome: string;
  pacCpf: string;
  pacNascimento: string;
  pacTelefone: string;
}

/* ── CSS Variables ── */
const v = {
  azul: '#1351b4',
  azulCl: '#dbe8fb',
  escuro: '#071d41',
  verde: '#168821',
  amarelo: '#fffbe6',
  amBorda: '#f0c040',
  cinza: '#f4f6fb',
  borda: '#dde3ef',
  texto: '#1a1a2e',
  muted: '#5a6275',
  branco: '#ffffff',
};

/* ── QR Code Canvas ── */
function desenharQR(canvas: HTMLCanvasElement, seed: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 80;
  const cell = 8;
  const cols = Math.floor(size / cell);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  let s = seed;
  function rand() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  }

  ctx.fillStyle = v.escuro;
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.5) ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
    }
  }

  function quadrado(x: number, y: number, ext: number, int_: number) {
    ctx!.fillStyle = v.escuro;
    ctx!.fillRect(x, y, ext * cell, ext * cell);
    ctx!.fillStyle = '#ffffff';
    ctx!.fillRect(x + cell, y + cell, (ext - 2) * cell, (ext - 2) * cell);
    ctx!.fillStyle = v.escuro;
    ctx!.fillRect(x + cell * 2, y + cell * 2, int_ * cell, int_ * cell);
  }

  quadrado(0, 0, 3, 1);
  quadrado((cols - 3) * cell, 0, 3, 1);
  quadrado(0, (cols - 3) * cell, 3, 1);
}

/* ── Componente Principal ── */
const ProtocoloAgendamento: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { userData } = useUser();

  const state = location.state as Partial<AgendamentoData> | null;

  /* Mascara CPF: mostra apenas últimos 2 dígitos */
  const mascaraCpf = (cpf: string) => {
    const nums = cpf.replace(/\D/g, '');
    if (nums.length === 11) return `***.***.**${nums.slice(8, 9)}-${nums.slice(9, 11)}`;
    return cpf;
  };

  const agendamento: AgendamentoData = {
    protocolo: state?.protocolo || 'ENX-00000000',
    data: state?.data || '—',
    hora: state?.hora || '—',
    clinicaNome: state?.clinicaNome || 'Clínica Oftalmológica Central',
    clinicaEndereco: state?.clinicaEndereco || 'Av. Goiás, 1234 – Setor Central · Goiânia – GO',
    clinicaTel: state?.clinicaTel || '(62) 3000-0000',
    pacNome: userData?.nome || state?.pacNome || 'Maria da Silva Oliveira',
    pacCpf: userData?.cpf ? mascaraCpf(userData.cpf) : (state?.pacCpf || '***.***.***-05'),
    pacNascimento: userData?.data_nascimento || state?.pacNascimento || '12/04/1968',
    pacTelefone: state?.pacTelefone || '(62) 9 9999-0000',
  };

  const [aceiteOk, setAceiteOk] = useState(false);
  const [aceiteTermo, setAceiteTermo] = useState(false);
  const [aceiteConfirma, setAceiteConfirma] = useState(false);
  const [showErro, setShowErro] = useState(false);
  const termosRef = useRef<HTMLDivElement>(null);
  const confirmaRef = useRef<HTMLDivElement>(null);

  const dataGeracao = new Date().toLocaleString('pt-BR');

  // Desenhar QR
  useEffect(() => {
    if (canvasRef.current) {
      const seed = agendamento.protocolo.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      desenharQR(canvasRef.current, seed);
    }
  }, [agendamento.protocolo]);

  const toggleAceite = useCallback(() => {
    setAceiteOk(prev => {
      if (!prev) {
        setTimeout(() => {
          termosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } else {
        setAceiteTermo(false);
        setAceiteConfirma(false);
      }
      return !prev;
    });
    setShowErro(false);
  }, []);

  const toggleTermo = useCallback(() => {
    setAceiteTermo(prev => {
      if (!prev) {
        setTimeout(() => {
          confirmaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } else {
        setAceiteConfirma(false);
      }
      return !prev;
    });
    setShowErro(false);
  }, []);

  const toggleConfirma = useCallback(() => {
    setAceiteConfirma(prev => !prev);
    setShowErro(false);
  }, []);

  const confirmarAgendamento = useCallback(() => {
    if (!aceiteOk || !aceiteTermo || !aceiteConfirma) {
      setShowErro(true);
      return;
    }
    navigate('/pagamento-gru');
  }, [aceiteOk, aceiteTermo, aceiteConfirma, navigate]);

  return (
    <div style={{ fontFamily: "'Rawline','Raleway',sans-serif", background: v.cinza, color: v.texto, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* BREADCRUMB */}
      <div style={{ background: v.branco, borderBottom: `1px solid ${v.borda}`, padding: '10px 0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 13, padding: 0, margin: 0 }}>
            <li><a href="#" style={{ color: v.azul, textDecoration: 'none' }}>Ministério da Saúde</a></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              <a href="#" style={{ color: v.azul, textDecoration: 'none' }}>Projeto Enxerga Brasil</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              <a href="#" style={{ color: v.azul, textDecoration: 'none' }}>Encontrar clínica</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#555' }}>
              <span style={{ fontSize: 10, color: '#ccc' }}>&gt;</span>
              Protocolo de agendamento
            </li>
          </ol>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: 860, margin: '28px auto', padding: '0 24px', flex: 1, width: '100%' }}>

        {/* CABEÇALHO DO PROTOCOLO */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 300, color: v.texto, marginBottom: 6 }}>
              Protocolo <strong>{agendamento.protocolo}</strong>
            </h1>
            <p style={{ fontSize: 13, color: v.muted, marginBottom: 10 }}>Gerado em {dataGeracao}</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 12px', borderRadius: 5, fontSize: 12, fontWeight: 700,
              background: '#fff3cd',
              border: `1px solid #f0c040`,
              color: '#7d5700',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: '#f0a500',
              }} />
              <span>Confirmação pendente</span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={80}
            height={80}
            style={{ border: `2px solid ${v.borda}`, borderRadius: 6, background: v.branco }}
          />
        </div>

        {/* DADOS DO PACIENTE */}
        <CardSection titulo="Dados do Paciente">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
            <DadoItem label="Nome completo" value={agendamento.pacNome} />
            <DadoItem label="CPF" value={agendamento.pacCpf} />
            <DadoItem label="Data de nascimento" value={agendamento.pacNascimento} />
          </div>
        </CardSection>

        {/* DADOS DA CONSULTA */}
        <CardSection titulo="Consulta Agendada">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
            {/* Data/Hora box */}
            <div style={{
              background: v.azulCl, border: '1px solid #b3c8f0', borderRadius: 6,
              padding: '14px 18px', gridColumn: '1 / -1',
              display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            }}>
              <DataHoraItem label="Data" value={agendamento.data} />
              <div className="data-hora-sep" style={{ width: 1, height: 36, background: '#b3c8f0' }} />
              <DataHoraItem label="Horário" value={agendamento.hora} />
              <div className="data-hora-sep" style={{ width: 1, height: 36, background: '#b3c8f0' }} />
              <DataHoraItem label="Tipo" value="Exame oftalmológico" />
            </div>

            <DadoItem label="Clínica" value={agendamento.clinicaNome} destaque />
            <DadoItem label="Endereço" value={agendamento.clinicaEndereco} />
            <DadoItem label="Custo do exame" value="R$ 0,00 — Gratuito" verde />
          </div>

          <div style={{
            background: v.azulCl, border: '1px solid #b3c8f0', borderRadius: 6,
            padding: '11px 16px', fontSize: 13, color: v.escuro, marginTop: 14, lineHeight: 1.55,
          }}>
            Compareça com <strong>15 minutos de antecedência</strong>. Leve documento de identidade com foto e CPF. O Cartão do SUS é opcional mas facilita o atendimento.
          </div>
        </CardSection>

        {/* TAXA DE NÃO COMPARECIMENTO */}
        <div style={{
          borderLeft: `4px solid ${v.amBorda}`, background: v.amarelo,
          borderRadius: '0 6px 6px 0', padding: '20px 22px', marginBottom: 14,
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700, color: '#5a3e00', marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            Taxa de Seguro por Não Comparecimento
            <span style={{ fontSize: 20, fontWeight: 800, color: '#5a3e00' }}>R$ 58,40</span>
          </h3>

          <p style={{ fontSize: 14, color: '#5a3e00', lineHeight: 1.65, marginBottom: 14 }}>
            Para garantir que nenhuma vaga seja desperdiçada e outros pacientes não sejam prejudicados, o Projeto Enxerga Brasil adota uma <strong>taxa de seguro por não comparecimento</strong>. Este valor <strong>só é cobrado caso você falte à consulta sem cancelar previamente</strong>.
          </p>

          <div style={{ borderLeft: '2px solid rgba(90,62,0,0.2)', paddingLeft: 14, marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#7a5500', margin: 0 }}>
              Este valor não é uma taxa do exame. Trata-se de uma <strong style={{ color: '#5a3e00' }}>garantia de comparecimento</strong> que assegura o comprometimento do paciente e a organização das vagas do programa público.
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#7a5500', marginBottom: 14 }}>
            O cancelamento pode ser feito <strong style={{ color: '#5a3e00' }}>gratuitamente pelo próprio site</strong>, com pelo menos <strong style={{ color: '#5a3e00' }}>24 horas de antecedência</strong>. Em caso de emergência médica comprovada, a taxa pode ser contestada em até 5 dias úteis.
          </p>

          {/* Aceite */}
          <div
            onClick={toggleAceite}
            style={{
              background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(90,62,0,0.15)',
              borderRadius: 6, padding: '12px 14px', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#5a3e00', lineHeight: 1.5 }}>
              <div style={{
                width: 18, height: 18, border: `2px solid ${aceiteOk ? '#5a3e00' : 'rgba(90,62,0,0.4)'}`,
                borderRadius: 3, flexShrink: 0, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: aceiteOk ? '#5a3e00' : 'transparent',
                color: aceiteOk ? '#ffcd07' : 'transparent',
                transition: 'all .15s',
              }}>
                {aceiteOk ? '✓' : ''}
              </div>
              <span>
                Estou ciente dos requisitos de comparecimento e das condições da taxa de não comparecimento de <strong>R$ 58,40</strong>, aplicável apenas em caso de ausência sem cancelamento prévio pelo site.
              </span>
            </div>
          </div>

          {showErro && !aceiteOk && (
            <div style={{
              fontSize: 12, color: '#c0392b', background: '#fdecea',
              borderLeft: '3px solid #c0392b', padding: '9px 12px',
              borderRadius: '0 4px 4px 0', marginTop: 10,
            }}>
              Você precisa confirmar o item acima antes de prosseguir.
            </div>
          )}
        </div>

        {/* BENEFÍCIOS + GARANTIAS + SEGUNDO ACEITE */}
        {aceiteOk && (
          <div
            ref={termosRef}
            style={{
              marginBottom: 14,
              transition: 'all 0.5s ease',
              opacity: 1,
            }}
          >
            {/* Benefícios */}
            <div style={{
              borderLeft: `4px solid ${v.azul}`,
              background: v.branco,
              padding: '24px 24px',
              marginBottom: 14,
              borderRadius: '0 8px 8px 0',
            }}>
              <h5 style={{ fontWeight: 600, color: '#333', marginBottom: 16, fontSize: 15 }}>
                Benefícios incluídos na regularização
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#555' }}>
                {[
                  'Vaga garantida no local e horário escolhidos',
                  'Acesso ao portal exclusivo do candidato',
                  'Material orientativo digital',
                  'Suporte técnico especializado',
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{
                      width: 8, height: 8, background: v.azul, borderRadius: '50%',
                      marginTop: 6, marginRight: 12, flexShrink: 0,
                    }} />
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Garantias */}
            <div style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '24px 24px', marginBottom: 14,
            }}>
              <h5 style={{ fontWeight: 600, color: '#333', marginBottom: 16, fontSize: 15 }}>
                Garantias oferecidas
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#15803d', marginBottom: 2 }}>Devolução após comparecimento</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>Valor integral da garantia devolvido automaticamente após sua presença na consulta</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>Cancelamento oficial</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>Reembolso integral se o processo for cancelado pela organização</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>Mudança de local</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>Transporte garantido em caso de alteração de endereço da consulta</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>Justificativa médica ou trabalhista</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>Reembolso de 100% com atestado médico ou declaração do trabalho até 7 dias antes da consulta</p>
                </div>
              </div>
            </div>

            {/* Segundo Aceite */}
            <div
              onClick={toggleTermo}
              style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 8, padding: '16px 18px', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#555' }}>
                <div style={{
                  width: 18, height: 18,
                  border: `2px solid ${aceiteTermo ? v.azul : '#9ca3af'}`,
                  borderRadius: 3, flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: aceiteTermo ? v.azul : 'transparent',
                  color: aceiteTermo ? '#fff' : 'transparent',
                  transition: 'all .15s',
                }}>
                  {aceiteTermo ? '✓' : ''}
                </div>
                <span style={{ lineHeight: 1.55 }}>
                  Aceito os termos e condições da taxa de seguro por não comparecimento do Projeto Enxerga Brasil.
                </span>
              </div>
            </div>

            {showErro && !aceiteTermo && (
              <div style={{
                fontSize: 12, color: '#c0392b', background: '#fdecea',
                borderLeft: '3px solid #c0392b', padding: '9px 12px',
                borderRadius: '0 4px 4px 0', marginTop: 10,
              }}>
                Você precisa aceitar os termos e condições antes de prosseguir.
              </div>
            )}
          </div>
        )}

        {/* INFORMAÇÕES + TERCEIRO ACEITE */}
        {aceiteTermo && (
          <div
            ref={confirmaRef}
            style={{ marginBottom: 14, transition: 'all 0.5s ease', opacity: 1 }}
          >
            {/* Informações importantes */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '24px 24px', marginBottom: 14,
            }}>
              <h5 style={{ fontWeight: 600, color: '#333', marginBottom: 16, fontSize: 15 }}>
                Informações importantes
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>Esta garantia comprova seu comprometimento com o agendamento e será devolvida após o comparecimento.</p>
                <p style={{ margin: 0 }}>Pacientes que confirmam presença através da quitação têm maior índice de comparecimento e atendimento.</p>
                <p style={{ margin: 0 }}>A regularização garante sua participação no programa e acesso aos recursos de apoio.</p>
                <p style={{ margin: 0 }}>Em caso de cancelamento oficial do programa, o valor é integralmente reembolsado.</p>
              </div>
            </div>

            {/* Projeto Enxerga Brasil */}
            <div style={{
              border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '24px 24px', marginBottom: 14, background: v.branco,
            }}>
              <h5 style={{ fontWeight: 600, color: '#333', marginBottom: 16, fontSize: 15 }}>
                Projeto Enxerga Brasil
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: v.azul }}>8.000+</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>consultas em todo o país</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: v.azul }}>27</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>estados contemplados</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, textAlign: 'center', marginBottom: 0 }}>
                Agendamento simplificado · Atendimento gratuito
              </p>
            </div>

            {/* Terceiro Aceite */}
            <div
              onClick={toggleConfirma}
              style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 8, padding: '16px 18px', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#555' }}>
                <div style={{
                  width: 18, height: 18,
                  border: `2px solid ${aceiteConfirma ? v.azul : '#9ca3af'}`,
                  borderRadius: 3, flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: aceiteConfirma ? v.azul : 'transparent',
                  color: aceiteConfirma ? '#fff' : 'transparent',
                  transition: 'all .15s',
                }}>
                  {aceiteConfirma ? '✓' : ''}
                </div>
                <span style={{ lineHeight: 1.55 }}>
                  Confirmo minha participação no Projeto Enxerga Brasil e finalização do agendamento.
                </span>
              </div>
            </div>

            {showErro && !aceiteConfirma && (
              <div style={{
                fontSize: 12, color: '#c0392b', background: '#fdecea',
                borderLeft: '3px solid #c0392b', padding: '9px 12px',
                borderRadius: '0 4px 4px 0', marginTop: 10,
              }}>
                Você precisa confirmar sua participação antes de prosseguir.
              </div>
            )}
          </div>
        )}

        {/* AÇÕES FINAIS */}
        <div style={{ marginTop: 4 }}>
          <button
            onClick={confirmarAgendamento}
            style={{
              width: '100%', background: v.verde, color: 'white',
              border: 'none', borderRadius: 6, padding: 15,
              fontSize: 16, fontWeight: 700, fontFamily: "'Rawline','Raleway',sans-serif",
              cursor: 'pointer', transition: 'background .15s', marginBottom: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0d5e19')}
            onMouseLeave={e => (e.currentTarget.style.background = v.verde)}
          >Confirmar agendamento</button>

          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD · Lei 13.709/2018).{' '}
            <a href="#" style={{ color: v.azul, textDecoration: 'none' }}>Política de Privacidade</a>
          </p>
        </div>
      </div>

      {/* modal removed: confirmation is handled via redirect to payment */}

      {/* FOOTER */}
      <footer style={{ background: v.escuro, color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '14px 24px', fontSize: 12 }}>
        Projeto Enxerga Brasil · Ministério da Saúde · Governo Federal &nbsp;·&nbsp; 0800 000 0000
      </footer>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 600px) {
          .data-hora-sep { display: none !important; }
        }
      `}</style>
    </div>
  );
};

/* ── Sub-componentes ── */

function CardSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: v.branco, border: `1px solid ${v.borda}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '10px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${v.borda}`, color: v.muted, background: v.cinza }}>
        {titulo}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function DadoItem({ label, value, destaque, verde }: { label: string; value: string; destaque?: boolean; verde?: boolean }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: 12, color: v.muted, marginBottom: 3 }}>{label}</span>
      <p style={{
        fontSize: destaque ? 15 : 14, fontWeight: 600,
        color: verde ? v.verde : destaque ? v.azul : v.texto,
        lineHeight: 1.4, margin: 0,
      }}>{value}</p>
    </div>
  );
}

function DataHoraItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b8ec7', fontWeight: 700, marginBottom: 3 }}>{label}</strong>
      <span style={{ fontSize: 16, fontWeight: 700, color: v.azul }}>{value}</span>
    </div>
  );
}

export default ProtocoloAgendamento;
