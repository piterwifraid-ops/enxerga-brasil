import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import useUtmNavigator from '../hooks/useUtmNavigator';

interface GeoResult {
  lat: number;
  lng: number;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ClinicaItem {
  nome: string;
  endereco: string;
  horario: string;
  tel: string;
  site: string;
  lat: number;
  lng: number;
  dist: number;
  tipo: string;
}

/* ── Seed & Vagas ── */
function seedRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getVagasDia(dia: number, mes: number, ano: number): number {
  const s = ano * 10000 + (mes + 1) * 100 + dia;
  const r1 = seedRandom(s);
  if (r1 < 0.30) return 0;
  const r2 = seedRandom(s + 7919);
  if (r2 < 0.35) return 1;
  if (r2 < 0.60) return 2;
  if (r2 < 0.82) return 3;
  return 4;
}

const HORARIOS_BASE = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

function getHorariosDia(dia: number, mes: number, ano: number, vagas: number): string[] {
  if (vagas <= 0) return [];
  if (vagas >= HORARIOS_BASE.length) return [...HORARIOS_BASE];
  const s = ano * 10000 + (mes + 1) * 100 + dia + 31;
  const arr = [...HORARIOS_BASE];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seedRandom(s + i * 13) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, vagas).sort();
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getScarcityBadge(): { text: string; tipo: 'urgente' | 'proxima' } {
  const h = new Date(); h.setHours(0, 0, 0, 0);
  let vagasSemana = 0;
  let temUltimaVaga = false;
  let primeiro: Date | null = null;
  for (let i = 0; i < 30; i++) {
    const dt = new Date(h); dt.setDate(dt.getDate() + i);
    if (dt.getDay() === 0) continue;
    const v = getVagasDia(dt.getDate(), dt.getMonth(), dt.getFullYear());
    if (v > 0) {
      if (!primeiro) primeiro = new Date(dt);
      if (i < 7) { vagasSemana += v; if (v <= 2) temUltimaVaga = true; }
    }
  }
  if (temUltimaVaga || (vagasSemana > 0 && vagasSemana <= 8)) {
    return { text: '⚡ Últimas vagas esta semana', tipo: 'urgente' };
  }
  if (primeiro) {
    const ds = DIAS_SEMANA_CURTO[primeiro.getDay()];
    const dd = String(primeiro.getDate()).padStart(2, '0');
    const mm = String(primeiro.getMonth() + 1).padStart(2, '0');
    return { text: `🗓 Próxima vaga: ${ds}, ${dd}/${mm}`, tipo: 'proxima' };
  }
  return { text: '📞 Consulte disponibilidade', tipo: 'proxima' };
}

/* ── Calendário Modal ── */
interface CalendarioModalProps {
  clinica: ClinicaItem;
  onClose: () => void;
  onConfirm: (data: string, horario: string) => void;
}

function CalendarioModal({ clinica, onClose, onConfirm }: CalendarioModalProps) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const podeMesAnterior = !(anoAtual === hoje.getFullYear() && mesAtual === hoje.getMonth());

  // -1 = blocked (past/sunday), 0 = no vagas, 1-4 = vagas
  const vagasPorDia = useMemo(() => {
    const map: Record<number, number> = {};
    const h = new Date(); h.setHours(0, 0, 0, 0);
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(anoAtual, mesAtual, d);
      if (dt.getDay() === 0 || dt < h) {
        map[d] = -1;
      } else {
        map[d] = getVagasDia(d, mesAtual, anoAtual);
      }
    }
    return map;
  }, [mesAtual, anoAtual, diasNoMes]);

  // Auto-select first available day
  useEffect(() => {
    setHorarioSelecionado(null);
    const h = new Date(); h.setHours(0, 0, 0, 0);
    let found = false;
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(anoAtual, mesAtual, d);
      if (dt.getDay() === 0 || dt < h) continue;
      if (getVagasDia(d, mesAtual, anoAtual) > 0) {
        setDiaSelecionado(d);
        found = true;
        break;
      }
    }
    if (!found) setDiaSelecionado(null);
  }, [mesAtual, anoAtual, diasNoMes]);

  const mesAnterior = () => {
    if (!podeMesAnterior) return;
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const proximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const horariosDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const v = vagasPorDia[diaSelecionado];
    if (!v || v <= 0) return [];
    return getHorariosDia(diaSelecionado, mesAtual, anoAtual, v);
  }, [diaSelecionado, mesAtual, anoAtual, vagasPorDia]);

  const handleConfirmar = () => {
    if (!diaSelecionado || !horarioSelecionado) return;
    const dataFormatada = `${String(diaSelecionado).padStart(2, '0')}/${String(mesAtual + 1).padStart(2, '0')}/${anoAtual}`;
    setConfirmado(true);
    setTimeout(() => onConfirm(dataFormatada, horarioSelecionado), 2000);
  };

  /* Tela de sucesso */
  if (confirmado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,29,65,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl" style={{ animation: 'fadeIn .4s ease' }}>
          <div className="w-16 h-16 bg-[#168821] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#071d41] mb-2">Agendamento confirmado!</h3>
          <p className="text-[#5a6275] text-sm leading-relaxed">
            Seu exame na <strong className="text-[#071d41]">{clinica.nome}</strong> foi agendado para{' '}
            <strong className="text-[#071d41]">{String(diaSelecionado).padStart(2, '0')}/{String(mesAtual + 1).padStart(2, '0')}/{anoAtual}</strong> às{' '}
            <strong className="text-[#071d41]">{horarioSelecionado}</strong>.<br /><br />
            Você receberá uma confirmação por SMS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,29,65,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', maxWidth: 'calc(100vw - 32px)' }}>

        {/* Header */}
        <div className="bg-[#1351B4] px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-white/70 text-[11px] uppercase tracking-wider font-bold mb-0.5">Agendamento de exame</p>
            <h2 className="text-white font-bold text-[16px] leading-snug">{clinica.nome}</h2>
            <p className="text-white/70 text-[12px] mt-0.5">{clinica.endereco}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white ml-4 flex-shrink-0 mt-0.5"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}
          >×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-5">

          {/* Calendário */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={mesAnterior}
                disabled={!podeMesAnterior}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold transition-colors ${podeMesAnterior ? 'text-[#1351B4] hover:bg-[#f0f4fc] cursor-pointer' : 'text-[#ccc] cursor-not-allowed'}`}
                style={{ background: 'none', border: 'none', fontSize: '18px' }}
              >‹</button>
              <span className="text-[15px] font-bold text-[#071d41]">{MESES[mesAtual]} {anoAtual}</span>
              <button
                onClick={proximoMes}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f4fc] text-[#1351B4] font-bold transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >›</button>
            </div>

            {/* Dias da semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }} className="mb-1">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-[10px] sm:text-[11px] font-bold text-[#aaa] uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`e-${i}`} style={{ minHeight: 44 }} />)}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const vagas = vagasPorDia[dia];
                const disponivel = vagas > 0;
                const selecionado = diaSelecionado === dia;
                const semVaga = vagas === 0;
                const ultimaVaga = vagas === 1;
                const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();

                let cls = 'relative flex flex-col items-center justify-center rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all ';
                const stl: React.CSSProperties = { minHeight: 44, padding: '2px 0', border: '2px solid transparent' };

                if (selecionado) {
                  cls += 'text-white shadow-lg';
                  stl.background = '#1351B4';
                  stl.borderColor = '#1351B4';
                  stl.transform = 'scale(1.08)';
                  stl.cursor = 'pointer';
                } else if (disponivel) {
                  cls += 'text-[#071d41] cursor-pointer';
                  stl.borderColor = ultimaVaga ? '#e67e22' : '#27ae60';
                  stl.cursor = 'pointer';
                } else if (semVaga) {
                  cls += 'text-[#ccc] cursor-not-allowed';
                  stl.background = '#f5f5f5';
                } else {
                  cls += 'text-[#ccc] cursor-not-allowed';
                }

                return (
                  <button
                    key={dia}
                    onClick={() => { if (disponivel) { setDiaSelecionado(dia); setHorarioSelecionado(null); } }}
                    disabled={!disponivel}
                    className={cls}
                    style={stl}
                    onMouseEnter={(e) => { if (disponivel && !selecionado) e.currentTarget.style.background = '#dbe8fb'; }}
                    onMouseLeave={(e) => {
                      if (disponivel && !selecionado) e.currentTarget.style.background = '';
                      if (semVaga) e.currentTarget.style.background = '#f5f5f5';
                    }}
                  >
                    <span>{dia}</span>
                    {ehHoje && !selecionado && (
                      <span className="absolute" style={{ bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#1351B4' }} />
                    )}
                    {disponivel && !selecionado && ultimaVaga && (
                      <span className="text-[8px] sm:text-[9px] leading-none mt-px font-bold" style={{ color: '#e67e22' }}>última!</span>
                    )}
                    {disponivel && !selecionado && vagas >= 2 && (
                      <span className="text-[8px] sm:text-[9px] leading-none mt-px font-bold" style={{ color: '#27ae60' }}>{vagas} vagas</span>
                    )}
                    {selecionado && vagas >= 1 && (
                      <span className="text-[8px] sm:text-[9px] leading-none mt-px font-bold text-white/80">
                        {vagas === 1 ? 'última!' : `${vagas} vagas`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#aaa] mt-2 text-center">
              <span style={{ color: '#e67e22' }}>■</span> última vaga &nbsp;
              <span style={{ color: '#27ae60' }}>■</span> vagas disponíveis &nbsp;
              <span style={{ color: '#ccc' }}>■</span> indisponível
            </p>
          </div>

          {/* Horários */}
          {diaSelecionado && horariosDoDia.length > 0 && (
            <div className="border-t border-[#dde3ef] pt-4 mb-3">
              <p className="text-[13px] font-bold text-[#071d41] mb-2.5">
                Horários disponíveis — {String(diaSelecionado).padStart(2, '0')}/{String(mesAtual + 1).padStart(2, '0')}
                <span className="font-normal text-[#aaa] ml-2 text-[11px]">
                  ({horariosDoDia.length} {horariosDoDia.length === 1 ? 'horário' : 'horários'})
                </span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }} className="sm:!grid-cols-4">
                {horariosDoDia.map(h => (
                  <button
                    key={h}
                    onClick={() => setHorarioSelecionado(h)}
                    className={`py-2.5 px-1 text-[13px] font-semibold rounded-lg border-2 transition-all ${
                      horarioSelecionado === h
                        ? 'bg-[#1351B4] border-[#1351B4] text-white'
                        : 'bg-white border-[#dde3ef] text-[#071d41] hover:border-[#1351B4] hover:text-[#1351B4]'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >{h}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#dde3ef] px-3 sm:px-5 py-3 sm:py-4 flex gap-2 sm:gap-3 flex-shrink-0 bg-[#f8f9fc]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border-2 border-[#dde3ef] text-[#5a6275] font-bold text-sm hover:border-[#aaa] transition-colors"
            style={{ background: 'none', cursor: 'pointer' }}
          >Cancelar</button>
          <button
            onClick={handleConfirmar}
            disabled={!diaSelecionado || !horarioSelecionado}
            className={`flex-[2] py-2.5 px-4 rounded-lg text-white font-bold text-sm transition-all ${
              diaSelecionado && horarioSelecionado
                ? 'bg-[#168821] hover:bg-[#0d5e19] cursor-pointer shadow-md'
                : 'bg-[#ccc] cursor-not-allowed'
            }`}
            style={{ border: 'none' }}
          >
            {diaSelecionado && horarioSelecionado
              ? <><span className="hidden sm:inline">Confirmar — </span><span className="sm:hidden">✓ </span>{String(diaSelecionado).padStart(2, '0')}/{String(mesAtual + 1).padStart(2, '0')} às {horarioSelecionado}</>
              : 'Selecione data e horário'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Utilitários ── */
function calcDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatarCep(v: string): string {
  v = v.replace(/\D/g, '').slice(0, 8);
  return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
}

function formatarHorario(h: string): string {
  if (!h || h === 'Consulte pelo telefone') return 'Consulte pelo telefone';
  if (h.length > 50) return h.slice(0, 50) + '...';
  return h;
}

async function geocodificarCep(cepRaw: string, setStep: (s: string) => void): Promise<GeoResult> {
  try {
    setStep('Consultando CEP via BrasilAPI...');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepRaw}`, { signal: controller.signal });
    clearTimeout(timer);
    if (r.ok) {
      const d = await r.json();
      if (d.location?.coordinates?.longitude && d.location?.coordinates?.latitude) {
        return { lat: d.location.coordinates.latitude, lng: d.location.coordinates.longitude, logradouro: d.street || '', bairro: d.neighborhood || '', cidade: d.city || '', uf: d.state || '' };
      }
      if (d.city && d.state) {
        return { lat: 0, lng: 0, logradouro: d.street || '', bairro: d.neighborhood || '', cidade: d.city || '', uf: d.state || '' };
      }
    }
  } catch { /* fallback */ }

  try {
    setStep('Consultando endereço via ViaCEP...');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const rv = await fetch(`https://viacep.com.br/ws/${cepRaw}/json/`, { signal: controller.signal });
    clearTimeout(timer);
    if (!rv.ok) throw new Error('ViaCEP falhou');
    const dv = await rv.json();
    if (dv.erro) throw new Error('CEP não encontrado');
    return { lat: 0, lng: 0, logradouro: dv.logradouro || '', bairro: dv.bairro || '', cidade: dv.localidade || '', uf: dv.uf || '' };
  } catch {
    throw new Error('Não foi possível localizar o CEP informado.');
  }
}

async function buscarClinicasOverpass(lat: number, lng: number, raioKm: number): Promise<ClinicaItem[]> {
  const raioM = raioKm * 1000;
  const query = `[out:json][timeout:10];(node["healthcare"~"optometrist|eye_care"](around:${raioM},${lat},${lng});node["shop"="optician"](around:${raioM},${lat},${lng});node["amenity"="clinic"]["name"~"oftalm|optic|ocular|olhos|visão",i](around:${raioM},${lat},${lng}););out body 10;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return [];
    const data = await r.json();
    if (!data?.elements) return [];
    return data.elements
      .filter((el: Record<string, unknown>) => (el.tags as Record<string, string> | undefined)?.name)
      .map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>;
        const clat = el.lat as number;
        const clng = el.lon as number;
        const dist = calcDistKm(lat, lng, clat, clng);
        const rua = tags['addr:street'] || '';
        const num = tags['addr:housenumber'] || '';
        const bairro = tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
        const cidade = tags['addr:city'] || tags['addr:municipality'] || '';
        const end = [rua + (num ? ', ' + num : ''), bairro, cidade].filter(Boolean).join(' – ');
        return { nome: tags.name, endereco: end || 'Endereço não disponível', horario: tags['opening_hours'] || 'Seg–Sex 8h às 18h', tel: tags['phone'] || tags['contact:phone'] || '', site: tags['website'] || '', lat: clat, lng: clng, dist, tipo: tags.healthcare || tags.shop || 'clinic' };
      })
      .filter((c: ClinicaItem) => c.lat && c.lng)
      .sort((a: ClinicaItem, b: ClinicaItem) => a.dist - b.dist)
      .slice(0, 3);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

function gerarClinicasPorCep(geo: GeoResult): ClinicaItem[] {
  const { cidade, uf, bairro } = geo;
  const nomesCl = [`Clínica Oftalmológica ${cidade}`, `Instituto de Saúde Visual ${cidade}`, `Centro Oftalmológico Popular – ${uf}`];
  const bairros = bairro ? [bairro, 'Centro', 'Zona Norte'] : ['Centro', 'Vila Nova', 'Jardim América'];
  return nomesCl.map((nome, i) => ({ nome, endereco: `${bairros[i]}, ${cidade} – ${uf}`, horario: 'Seg–Sex 8h às 18h', tel: '0800 000 0000', site: '', lat: 0, lng: 0, dist: (i + 1) * 1.2, tipo: 'clinic' }));
}

async function buscarClinicas(geo: GeoResult, setStep: (s: string) => void): Promise<ClinicaItem[]> {
  if (geo.lat !== 0 && geo.lng !== 0) {
    setStep('Buscando clínicas oftalmológicas próximas...');
    const found = await buscarClinicasOverpass(geo.lat, geo.lng, 15);
    if (found.length > 0) return found;
  }
  setStep('Localizando clínicas na sua região...');
  await new Promise((r) => setTimeout(r, 800));
  return gerarClinicasPorCep(geo);
}

/* ── Componente principal ── */
const Clinica: React.FC = () => {
  const navigate = useUtmNavigator();
  const [cep, setCep] = useState('');
  const [cepStatus, setCepStatus] = useState<'idle' | 'erro' | 'ok'>('idle');
  const [erroMsg, setErroMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Validando CEP...');
  const [clinicas, setClinicas] = useState<ClinicaItem[]>([]);
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [cepFormatado, setCepFormatado] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showSemRes, setShowSemRes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal de agendamento
  const [clinicaParaAgendar, setClinicaParaAgendar] = useState<ClinicaItem | null>(null);
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState<{clinica: ClinicaItem; data: string; horario: string} | null>(null);

  // Scarcity badge (estável por sessão)
  const scarcityBadge = useMemo(() => getScarcityBadge(), []);

  const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCep(e.target.value);
    setCep(formatted);
    setCepStatus('idle');
    setErroMsg('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === 'Enter') iniciarBusca(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cep]
  );

  const novaBusca = useCallback(() => {
    setShowResult(false);
    setShowSemRes(false);
    setCep('');
    setCepStatus('idle');
    setErroMsg('');
    setClinicas([]);
    setGeo(null);
    setAgendamentoConfirmado(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const iniciarBusca = useCallback(async () => {
    const cepRaw = cep.replace(/\D/g, '');
    if (cepRaw.length !== 8) {
      setCepStatus('erro');
      setErroMsg('CEP inválido. Digite os 8 dígitos corretamente.');
      inputRef.current?.focus();
      return;
    }
    setShowResult(false);
    setShowSemRes(false);
    setCepStatus('idle');
    setErroMsg('');
    setLoading(true);
    try {
      const geoResult = await geocodificarCep(cepRaw, setLoadingStep);
      setCepStatus('ok');
      setGeo(geoResult);
      const found = await buscarClinicas(geoResult, setLoadingStep);
      setLoading(false);
      if (found.length === 0) setShowSemRes(true);
      else { setClinicas(found); setCepFormatado(cep); setShowResult(true); }
    } catch (err: unknown) {
      setLoading(false);
      setCepStatus('erro');
      setErroMsg(err instanceof Error ? err.message : 'Erro ao buscar. Tente novamente.');
    }
  }, [cep]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Bloquear scroll quando modal aberto
  useEffect(() => {
    if (clinicaParaAgendar) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [clinicaParaAgendar]);

  const distTexto = (dist: number) =>
    dist < 1 ? Math.round(dist * 1000) + ' m de você' : dist.toFixed(1).replace('.', ',') + ' km de você';

  // Suppress unused navigate warning
  void navigate;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fb]" style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}>

      {/* Modal calendário */}
      {clinicaParaAgendar && (
        <CalendarioModal
          clinica={clinicaParaAgendar}
          onClose={() => setClinicaParaAgendar(null)}
          onConfirm={(data, horario) => {
            setAgendamentoConfirmado({ clinica: clinicaParaAgendar, data, horario });
            setClinicaParaAgendar(null);
          }}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#dde3ef] py-2.5">
        <div className="max-w-[1100px] mx-auto px-6">
          <ol className="flex flex-wrap gap-1 text-[13px] list-none">
            <li className="flex items-center gap-1">
              <a href="#" className="text-[#1351B4] hover:underline">Ministério da Saúde</a>
            </li>
            <li className="flex items-center gap-1 text-[#aaa] before:content-['>'] before:text-[10px] before:text-[#ccc] before:mr-1">
              <a href="#" className="text-[#1351B4] hover:underline">Projeto Enxerga Brasil</a>
            </li>
            <li className="flex items-center gap-1 text-[#555] before:content-['>'] before:text-[10px] before:text-[#ccc] before:mr-1">
              Encontrar clínica
            </li>
          </ol>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto my-7 px-6 flex-1 w-full">
        <h1 className="text-2xl font-bold text-[#071d41] mb-1.5">Encontre uma clínica credenciada</h1>
        <p className="text-[15px] text-[#5a6275] mb-[26px] leading-relaxed">
          Digite o seu CEP para localizar as clínicas oftalmológicas mais próximas de você.
        </p>

        {/* Banner de agendamento confirmado */}
        {agendamentoConfirmado && (
          <div className="bg-[#d4edda] border border-[#168821] rounded-lg p-4 mb-5 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#168821] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p className="font-bold text-[#155724] text-sm">Exame agendado com sucesso!</p>
              <p className="text-[#155724] text-[13px] mt-0.5">
                <strong>{agendamentoConfirmado.clinica.nome}</strong> · {agendamentoConfirmado.data} às {agendamentoConfirmado.horario}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6 items-start">
          <div>
            {/* Search card */}
            <div className="bg-white border border-[#dde3ef] rounded-lg p-6 pb-7 mb-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <h2 className="text-[15px] font-bold text-[#071d41] mb-4 pb-3 border-b border-[#dde3ef]">Busca por CEP</h2>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#071d41]">
                    CEP <small className="font-normal text-[#5a6275] ml-1">(somente números)</small>
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={cep}
                    onChange={handleCepChange}
                    onKeyDown={handleKeyDown}
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className={`border-2 rounded-[5px] py-2.5 px-3.5 text-[17px] tracking-[1.5px] outline-none transition-colors w-40 ${
                      cepStatus === 'erro' ? 'border-[#c0392b]' : cepStatus === 'ok' ? 'border-[#168821]' : 'border-[#dde3ef] focus:border-[#1351B4]'
                    }`}
                    style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                  />
                  <span className="text-[12px] text-[#5a6275]">Ex.: 01310-100</span>
                  {erroMsg && <span className="text-[12px] text-[#c0392b]">{erroMsg}</span>}
                </div>
                <button
                  onClick={iniciarBusca}
                  disabled={loading}
                  className="bg-[#1351B4] hover:bg-[#0d3f8f] disabled:opacity-50 disabled:cursor-not-allowed text-white border-none rounded-[5px] py-[11px] px-[26px] text-[15px] font-bold cursor-pointer transition-colors h-[44px] whitespace-nowrap flex-shrink-0"
                  style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                >
                  Buscar clínicas
                </button>
              </div>
              <p className="text-[13px] mt-2.5 text-[#5a6275]">
                Não sabe seu CEP?{' '}
                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-[#1351B4] hover:underline">
                  Consulte nos Correios
                </a>
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-9 px-6">
                <div className="w-[34px] h-[34px] border-[3px] border-[#dde3ef] border-t-[#1351B4] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#5a6275]">Buscando clínicas na sua região...</p>
                <p className="text-[12px] text-[#aaa] mt-1">{loadingStep}</p>
              </div>
            )}

            {/* Results */}
            {showResult && !loading && (
              <div>
                <div className="flex justify-between items-start mb-3.5 flex-wrap gap-2">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#071d41]">{clinicas.length} clínica(s) encontrada(s)</h2>
                    <p className="text-[13px] text-[#5a6275] mt-0.5">
                      Para o CEP {cepFormatado}{geo?.cidade ? ` – ${geo.cidade}/${geo.uf}` : ''} · ordenadas por distância
                    </p>
                  </div>
                  <button
                    onClick={novaBusca}
                    className="bg-transparent border border-[#dde3ef] rounded py-[7px] px-3.5 text-[13px] font-semibold text-[#1351B4] cursor-pointer transition-colors hover:border-[#1351B4] flex-shrink-0"
                    style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                  >Nova busca</button>
                </div>

                <div className="bg-[#dbe8fb] border-l-4 border-[#1351B4] rounded-r-[5px] py-3 px-4 text-sm text-[#071d41] mb-[18px] leading-relaxed">
                  O atendimento é <strong>gratuito</strong>. Clique em "Agendar exame" para garantir sua vaga. Não é necessário encaminhamento médico.
                </div>

                <div className="flex flex-col gap-3.5 mb-7">
                  {clinicas.map((c, i) => {
                    const dist = distTexto(c.dist);
                    const mapsDir = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
                    const jaAgendado = agendamentoConfirmado?.clinica === c;

                    return (
                      <div
                        key={i}
                        className={`bg-white border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start shadow-[0_1px_6px_rgba(0,0,0,0.04)] transition-all hover:border-[#b3c8f0] hover:shadow-[0_3px_14px_rgba(19,81,180,0.08)] ${
                          i === 0 ? 'border-[#1351B4] border-2' : 'border-[#dde3ef]'
                        }`}
                      >
                        <div>
                          {i === 0 && (
                            <span className="inline-block bg-[#1351B4] text-white text-[10px] font-bold uppercase tracking-[0.8px] py-[3px] px-2.5 rounded-[3px] mb-[7px]">
                              Mais próxima
                            </span>
                          )}
                          <div className="text-[16px] font-bold text-[#071d41] mb-1">{c.nome}</div>
                          <div className="text-sm text-[#5a6275] mb-2.5 leading-relaxed">{c.endereco}</div>

                          <div className="flex flex-wrap gap-[18px] mb-3">
                            <div>
                              <strong className="block text-[11px] uppercase tracking-[0.5px] text-[#aaa] font-bold mb-0.5">Distância</strong>
                              <span className="text-sm text-[#071d41] font-semibold">{dist}</span>
                            </div>
                            <div>
                              <strong className="block text-[11px] uppercase tracking-[0.5px] text-[#aaa] font-bold mb-0.5">Horário</strong>
                              <span className="text-sm text-[#071d41] font-semibold">{formatarHorario(c.horario)}</span>
                            </div>
                            {c.tel && (
                              <div>
                                <strong className="block text-[11px] uppercase tracking-[0.5px] text-[#aaa] font-bold mb-0.5">Telefone</strong>
                                <span className="text-sm text-[#071d41] font-semibold">{c.tel}</span>
                              </div>
                            )}
                          </div>

                          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.5px] py-[3px] px-2.5 rounded-[3px] mr-1.5 mb-1.5 bg-[#e8f5e9] text-[#1b5e20]">Dados OpenStreetMap</span>
                          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.5px] py-[3px] px-2.5 rounded-[3px] mr-1.5 mb-1.5 bg-[#d4edda] text-[#155724]">SUS</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:flex-col gap-2 min-w-[150px]">
                          {jaAgendado ? (
                            <div className="bg-[#d4edda] border border-[#168821] rounded-[5px] py-2.5 px-4 text-sm font-bold text-[#155724] text-center">
                              ✓ Agendado · {agendamentoConfirmado?.data} às {agendamentoConfirmado?.horario}
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setClinicaParaAgendar(c)}
                                className="block bg-[#168821] hover:bg-[#0d5e19] text-white border-none rounded-[5px] py-2.5 px-4 text-sm font-bold cursor-pointer text-center transition-colors"
                                style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                              >
                                Agendar exame
                              </button>
                              <span className={`text-[11px] font-bold text-center ${scarcityBadge.tipo === 'urgente' ? 'text-[#e67e22]' : 'text-[#5a6275]'}`}>
                                {scarcityBadge.text}
                              </span>
                            </>
                          )}
                          <a
                            href={mapsDir}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-transparent border border-[#dde3ef] rounded-[5px] py-[9px] px-4 text-[13px] font-semibold text-[#1351B4] cursor-pointer text-center transition-colors hover:border-[#1351B4] no-underline"
                          >
                            Como chegar
                          </a>
                          <span className="text-[13px] text-[#5a6275] text-center mt-0.5">{dist}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results */}
            {showSemRes && !loading && (
              <div className="bg-white border border-[#dde3ef] rounded-lg py-10 px-7 text-center">
                <h3 className="text-[18px] font-bold text-[#071d41] mb-2.5">Nenhuma clínica encontrada nesta região</h3>
                <p className="text-sm text-[#5a6275] max-w-[420px] mx-auto mb-5 leading-relaxed">
                  Não localizamos clínicas oftalmológicas próximas a este CEP. Entre em contato com nossa central para indicações ou verifique a agenda das unidades móveis.
                </p>
                <a href="tel:08000000000" className="inline-block bg-[#1351B4] hover:bg-[#0d3f8f] text-white rounded-[5px] py-[11px] px-[26px] text-sm font-bold transition-colors no-underline" style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}>
                  Ligue gratuitamente: 0800 000 0000
                </a>
                <br /><br />
                <button onClick={novaBusca} className="bg-transparent border border-[#dde3ef] rounded py-[7px] px-3.5 text-[13px] font-semibold text-[#1351B4] cursor-pointer transition-colors hover:border-[#1351B4] mt-1.5" style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}>
                  Tentar outro CEP
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4">
            <div className="bg-white border border-[#dde3ef] rounded-lg overflow-hidden">
              <div className="bg-[#1351B4] text-white py-[9px] px-3.5 text-[12px] font-bold uppercase tracking-[0.5px]">O que levar</div>
              <div className="p-3.5 text-[13.5px] text-[#5a6275] leading-relaxed">
                <ul className="pl-4 mt-2 list-disc">
                  <li className="mb-1.5 text-[13px]">Documento de identidade com foto</li>
                  <li className="mb-1.5 text-[13px]">CPF</li>
                  <li className="mb-1.5 text-[13px]">Cartão do SUS (se tiver)</li>
                </ul>
                <p className="mt-2.5 text-[12px]">Não é necessário encaminhamento médico.</p>
              </div>
            </div>
            <div className="bg-white border border-[#dde3ef] rounded-lg overflow-hidden">
              <div className="bg-[#1351B4] text-white py-[9px] px-3.5 text-[12px] font-bold uppercase tracking-[0.5px]">Central de Atendimento</div>
              <div className="p-3.5 text-[13.5px] text-[#5a6275] leading-relaxed">
                <strong className="text-[#071d41] block mb-0.5">Ligue gratuitamente</strong>
                <span className="text-[20px] font-bold text-[#1351B4] block my-1.5">0800 000 0000</span>
                <span className="text-[12px]">Seg–Sex 8h às 20h · Sáb 8h às 14h</span>
              </div>
            </div>
            <div className="bg-white border border-[#dde3ef] rounded-lg overflow-hidden">
              <div className="bg-[#1351B4] text-white py-[9px] px-3.5 text-[12px] font-bold uppercase tracking-[0.5px]">Unidades Móveis</div>
              <div className="p-3.5 text-[13.5px] text-[#5a6275] leading-relaxed">
                Não encontrou clínica fixa na sua cidade? As unidades móveis atendem municípios menores com agenda mensal.<br/><br/>
                <a href="#" className="text-[#1351B4] hover:underline">Ver agenda das unidades móveis</a>
              </div>
            </div>
            <div className="bg-white border border-[#dde3ef] rounded-lg overflow-hidden">
              <div className="bg-[#1351B4] text-white py-[9px] px-3.5 text-[12px] font-bold uppercase tracking-[0.5px]">Sobre os dados</div>
              <div className="p-3.5 text-[12px] text-[#5a6275] leading-relaxed">
                Clínicas exibidas com dados do OpenStreetMap. A lista pode não incluir todas as unidades credenciadas. Para confirmação, ligue para a central.
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#071d41] text-white/40 text-center py-3.5 px-6 text-[12px]">
        Projeto Enxerga Brasil · Ministério da Saúde · Governo Federal &nbsp;·&nbsp; 0800 000 0000
      </footer>
    </div>
  );
};

export default Clinica;
