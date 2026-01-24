import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, Loader2, Sparkles, ChevronRight, TrendingUp } from 'lucide-react';
import { JobApplication, OfferEvaluation } from '../types';
import { compareOffers } from '../services/gemini';

interface OfferComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: JobApplication[];
}

const OfferComparisonModal: React.FC<OfferComparisonModalProps> = ({ isOpen, onClose, offers }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluations, setEvaluations] = useState<OfferEvaluation[] | null>(null);

  if (!isOpen) return null;

  const handleCompare = async () => {
    setIsAnalyzing(true);
    try {
      const data = offers.map(o => ({
        title: o.title,
        company: o.company,
        description: o.description
      }));
      const results = await compareOffers(data);
      setEvaluations(results);
    } catch (err) {
      alert("Failed to compare offers. Check your API key.");
    } finally {
      setIsAnalyzing(true);
      setTimeout(() => setIsAnalyzing(false), 500); // Small delay for UX feel
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Award className="w-7 h-7 text-indigo-600" /> Offer Decision Engine
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparing {offers.length} active offers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-slate-50/50">
          {!evaluations ? (
            <div className="text-center py-20">
              <div className="bg-indigo-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200">
                <TrendingUp className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Need a Tie-Breaker?</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
                Our AI will evaluate role impact, growth potential, and company culture descriptions to rank your offers and help you make the best choice.
              </p>
              <button 
                onClick={handleCompare}
                disabled={isAnalyzing}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mx-auto"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Compare Offers Now
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {evaluations.map((item) => (
                <div key={item.company} className={`bg-white rounded-3xl p-6 border-2 transition-all ${item.rank === 1 ? 'border-indigo-600 shadow-xl shadow-indigo-100 relative overflow-hidden' : 'border-slate-200'}`}>
                  {item.rank === 1 && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Recommended Choice
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${item.rank === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {item.rank}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 leading-tight">{item.company}</h4>
                      <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">{item.title}</p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                    "{item.why}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> High Impact Areas
                      </h5>
                      <div className="space-y-2">
                        {item.pros.map((p, i) => (
                          <div key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg">
                            <ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> Potential Trade-offs
                      </h5>
                      <div className="space-y-2">
                        {item.cons.map((c, i) => (
                          <div key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2 bg-rose-50/50 p-2 rounded-lg">
                            <ChevronRight className="w-3 h-3 text-rose-300 mt-0.5 shrink-0" /> {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-8">
                <button 
                  onClick={() => setEvaluations(null)}
                  className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Reset Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferComparisonModal;