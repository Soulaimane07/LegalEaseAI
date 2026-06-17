import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeAnalysisPanel } from '../../../redux/slices/chatSlice';
import { IoClose } from 'react-icons/io5';
import { LuShieldAlert, LuListChecks, LuFileWarning, LuLightbulb, LuScale } from 'react-icons/lu';

// Normalize the (free-text) severity returned by the model into a color theme.
const SEVERITIES = [
  { keys: ['eleve', 'élevé', 'élevée', 'elevee', 'high', 'grave', 'critique'],
    card: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Élevé' },
  { keys: ['moyen', 'moyenne', 'medium', 'modere', 'modéré'],
    card: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Moyen' },
  { keys: ['faible', 'low', 'mineur', 'bas'],
    card: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Faible' },
];
function severityTheme(s) {
  const v = (s || '').toString().toLowerCase();
  return (
    SEVERITIES.find((t) => t.keys.some((k) => v.includes(k))) || {
      card: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: s || '—',
    }
  );
}

const SectionTitle = ({ icon: Icon, children, count }) => (
  <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
    <Icon size={18} className="text-gray-700" />
    <h3 className="font-semibold text-gray-900">{children}</h3>
    {typeof count === 'number' && (
      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{count}</span>
    )}
  </div>
);

const Bullets = ({ items, empty }) =>
  items && items.length ? (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-[15px] text-gray-700" dir="auto">
          <span className="text-gray-400 mt-1">•</span>
          <span>{typeof it === 'string' ? it : JSON.stringify(it)}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-gray-400 italic">{empty}</p>
  );

export default function AnalysisPanel() {
  const dispatch = useDispatch();
  const { analysisOpen, analysisLoading, analysis, analysisError, analysisDocument } =
    useSelector((s) => s.chat);

  if (!analysisOpen) return null;

  const risks = analysis?.risks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={() => dispatch(closeAnalysisPanel())}>
      <div className="bg-white w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <LuScale size={22} className="text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900 leading-tight">Analyse du contrat</h2>
              {analysisDocument && <p className="text-xs text-gray-500">📎 {analysisDocument}</p>}
            </div>
          </div>
          <button onClick={() => dispatch(closeAnalysisPanel())}
                  className="text-gray-400 hover:text-gray-700 transition-colors">
            <IoClose size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
          {analysisLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <img src="/images/logo.png" className="w-10 animate-spin mb-4"
                   style={{ animationDuration: '1.5s' }} alt="" />
              <p className="text-sm">Analyse juridique en cours…</p>
            </div>
          )}

          {analysisError && !analysisLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {analysisError}
            </div>
          )}

          {analysis && !analysisLoading && (
            <>
              {/* Grounded badge */}
              <div className="flex items-center gap-2 mb-4">
                {analysis.grounded ? (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                    ⚖️ Ancré sur la loi marocaine
                  </span>
                ) : (
                  <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 rounded-full px-2.5 py-1">
                    ℹ️ Analyse générale (base de loi non indexée)
                  </span>
                )}
              </div>

              {/* Summary */}
              {analysis.summary && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-[15px] text-gray-800 leading-relaxed" dir="auto">
                  {analysis.summary}
                </div>
              )}

              {/* Risks */}
              <SectionTitle icon={LuShieldAlert} count={risks.length}>Risques détectés</SectionTitle>
              {risks.length ? (
                <div className="space-y-3">
                  {risks.map((r, i) => {
                    const t = severityTheme(r.severity);
                    return (
                      <div key={i} className={`border rounded-xl p-4 ${t.card}`} dir="auto">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-gray-900">{r.clause || r.title || `Risque ${i + 1}`}</span>
                          <span className={`shrink-0 text-xs font-medium rounded-full px-2.5 py-0.5 flex items-center gap-1.5 ${t.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${t.dot}`} /> {t.label}
                          </span>
                        </div>
                        {(r.explanation || r.description) && (
                          <p className="text-sm text-gray-700 leading-relaxed">{r.explanation || r.description}</p>
                        )}
                        {(r.law_reference || r.reference) && (
                          <p className="text-xs text-gray-500 mt-2">📖 {r.law_reference || r.reference}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucun risque majeur détecté.</p>
              )}

              {/* Obligations */}
              <SectionTitle icon={LuListChecks} count={analysis.obligations?.length}>Obligations</SectionTitle>
              <Bullets items={analysis.obligations} empty="Aucune obligation listée." />

              {/* Missing clauses */}
              <SectionTitle icon={LuFileWarning} count={analysis.missing_clauses?.length}>Clauses manquantes</SectionTitle>
              <Bullets items={analysis.missing_clauses} empty="Aucune clause manquante identifiée." />

              {/* Recommendations */}
              <SectionTitle icon={LuLightbulb} count={analysis.recommendations?.length}>Recommandations</SectionTitle>
              <Bullets items={analysis.recommendations} empty="Aucune recommandation." />

              {/* Sources */}
              {analysis.sources?.length > 0 && (
                <>
                  <SectionTitle icon={LuScale} count={analysis.sources.length}>Sources de loi utilisées</SectionTitle>
                  <div className="space-y-2">
                    {analysis.sources.map((src, i) => (
                      <p key={i} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2" dir="auto">
                        {typeof src === 'string' ? src : src.text}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-center text-xs text-gray-400 shrink-0">
          LegalEase est une IA et peut faire des erreurs. Ceci ne constitue pas un avis juridique.
        </div>
      </div>
    </div>
  );
}
