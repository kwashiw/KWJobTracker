import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Sparkles, CheckCircle2, TrendingUp, AlertCircle, Upload, Loader2, FileUp, Edit3, Eye, ExternalLink, Download, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { JobApplication, ResumeData } from '../types';

interface ResumeLabProps {
  resumeData: ResumeData;
  jobs: JobApplication[];
  onSaveResume: (data: ResumeData) => void;
  onUpdateJob: (id: string, updates: Partial<JobApplication>) => void;
}

const ResumeLab: React.FC<ResumeLabProps> = ({ resumeData, jobs, onSaveResume, onUpdateJob }) => {
  const [editing, setEditing] = useState(!resumeData.content);
  const [tempText, setTempText] = useState(resumeData.type === 'pdf' ? resumeData.extractedText || '' : resumeData.content || '');
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll for PDF.js engine
  useEffect(() => {
    const checkEngine = () => {
      // @ts-ignore
      const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (pdfjs) {
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        setIsEngineReady(true);
        return true;
      }
      return false;
    };

    if (!checkEngine()) {
      const interval = setInterval(() => {
        if (checkEngine()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Sync tempText with resumeData prop changes
  useEffect(() => {
    if (!resumeData.content || !editing) {
      setTempText(resumeData.type === 'pdf' ? resumeData.extractedText || '' : resumeData.content || '');
    }
  }, [resumeData.content, resumeData.type, resumeData.extractedText, editing]);

  const getPdfjs = () => {
    // @ts-ignore
    return window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  };

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current || !containerRef.current) return;
    
    setIsRendering(true);
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      const unscaledViewport = page.getViewport({ scale: 1 });
      const containerWidth = containerRef.current.clientWidth;
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale: scale * 2 });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${(containerWidth / unscaledViewport.width) * unscaledViewport.height}px`;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
    } catch (err) {
      console.error("Page render error:", err);
    } finally {
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const pdfjs = getPdfjs();

    if (resumeData.type === 'pdf' && resumeData.content && !editing && pdfjs) {
      const loadPdf = async () => {
        try {
          const loadingTask = pdfjs.getDocument(resumeData.content);
          const pdf = await loadingTask.promise;
          if (!active) { pdf.destroy(); return; }
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages);
          setTimeout(() => { if (active) renderPage(currentPage); }, 100);
        } catch (err) {
          console.error("PDF load error:", err);
        }
      };
      loadPdf();
    } else {
      if (pdfDocRef.current) { 
        pdfDocRef.current.destroy?.(); 
        pdfDocRef.current = null; 
      }
      setNumPages(0);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.style.width = '0px';
        canvasRef.current.style.height = '0px';
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    }
    return () => { active = false; };
  }, [resumeData.content, resumeData.type, editing, renderPage, currentPage, isEngineReady]);

  useEffect(() => {
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { if (pdfDocRef.current) renderPage(currentPage); }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); };
  }, [currentPage, renderPage]);

  const handleSaveText = () => {
    onSaveResume({ type: 'text', content: tempText, extractedText: tempText });
    setEditing(false);
  };

  const handleClearResume = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Remove your current resume profile? This will clear all match analysis context.")) {
      onSaveResume({ type: 'text', content: '', extractedText: '' });
      setTempText('');
      setEditing(true);
      setCurrentPage(1);
      setNumPages(0);
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy?.();
        pdfDocRef.current = null;
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pdfjs = getPdfjs();
    
    if (!file) return;
    if (!pdfjs || !isEngineReady) {
      alert("Career engine is still warming up. Please try again in 2 seconds.");
      return;
    }

    if (file.type !== 'application/pdf') { alert("Please upload a PDF file."); return; }
    if (file.size > 4 * 1024 * 1024) { alert("File too large. Please keep PDF resumes under 4MB for optimal performance."); return; }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str || "").join(" ") + "\n";
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onSaveResume({ type: 'pdf', content: event.target?.result as string, extractedText: fullText });
        setEditing(false);
        setIsUploading(false);
        setCurrentPage(1);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("PDF extraction error:", err);
      alert("Failed to process PDF. Try another file or paste text manually.");
      setIsUploading(false);
    }
  };

  const analyzedJobs = jobs.filter(j => j.analysis).sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Career Engine</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">AI match scoring & tech prep</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handlePdfUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {resumeData.content ? 'Update PDF' : 'Upload Resume PDF'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                {resumeData.type === 'pdf' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />} 
                {resumeData.type === 'pdf' ? 'Visual Document' : 'Resume Profile'}
              </h3>
              <div className="flex items-center gap-2">
                {resumeData.type === 'pdf' && numPages > 1 && (
                  <div className="flex items-center gap-2 mr-4 bg-white border border-slate-200 rounded-lg p-1">
                    <button 
                      disabled={currentPage <= 1 || isRendering}
                      onClick={() => { setCurrentPage(p => p - 1); }}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-black text-slate-500 w-12 text-center uppercase">{currentPage} / {numPages}</span>
                    <button 
                      disabled={currentPage >= numPages || isRendering}
                      onClick={() => { setCurrentPage(p => p + 1); }}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {editing ? (
                    <div className="flex items-center gap-1.5">
                      {resumeData.content && (
                        <button onClick={() => { setTempText(resumeData.type === 'pdf' ? resumeData.extractedText || '' : resumeData.content || ''); setEditing(false); }} className="text-slate-500 font-bold text-[10px] uppercase hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all">Discard</button>
                      )}
                      <button onClick={handleSaveText} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-700 transition-all">Save Profile</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(true); }} className="text-indigo-600 font-bold text-[10px] uppercase hover:bg-indigo-50 px-3 py-1.5 rounded-lg">Manual Edit</button>
                  )}
                  {resumeData.content && (
                    <button 
                      onClick={handleClearResume} 
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div ref={containerRef} className="flex-1 bg-slate-200 relative flex flex-col items-center overflow-y-auto max-h-[800px] scroll-smooth">
              {editing && resumeData.type === 'pdf' && (
                <div className="w-full px-6 pt-4">
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
                      Manual edits will convert your PDF to a text-only profile. For best results, update your PDF externally and re-upload it using the <span className="font-black">Update PDF</span> button above.
                    </p>
                  </div>
                </div>
              )}
              {editing ? (
                <div className="w-full h-full p-6">
                  <textarea 
                    value={tempText}
                    onChange={e => setTempText(e.target.value)}
                    placeholder="Paste resume profile text here..."
                    className="w-full h-full min-h-[600px] p-8 bg-white border border-slate-300 rounded-3xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium text-slate-700 resize-none outline-none shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center bg-white">
                  {resumeData.type === 'pdf' && resumeData.content ? (
                    <div className="relative w-full bg-white shadow-lg">
                      {isRendering && <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}
                      <canvas ref={canvasRef} className="w-full h-auto block" />
                    </div>
                  ) : resumeData.content ? (
                    <div className="w-full p-10 sm:p-14 bg-white text-slate-800 font-medium text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto shadow-sm">
                      {resumeData.content}
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[600px] flex items-center justify-center p-6 text-center bg-slate-100">
                      <div className="flex flex-col items-center">
                        <FileText className="w-16 h-16 text-slate-400/50 mb-6" />
                        <h4 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-2">No Profile Detected</h4>
                        <p className="text-slate-400 font-bold text-[11px] max-w-xs leading-relaxed">Upload a PDF or paste text to enable AI fit analysis.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-900 text-white/50 text-[8px] font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
               <CheckCircle2 className={`w-3 h-3 ${resumeData.extractedText.length > 50 ? 'text-emerald-400' : 'text-slate-600'}`} />
               AI Analysis Context Strength: {resumeData.extractedText.length} Characters
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Role Leaderboard</h3>
            {analyzedJobs.length === 0 ? (
              <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
                <p className="text-xs text-slate-400 font-bold leading-relaxed">Run a "Compatibility Check" on a role to populate this leaderboard.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyzedJobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-0.5">{job.analysis?.score}%</span>
                      <span className="text-[6px] font-black text-white uppercase tracking-widest">Match</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-800 truncate">{job.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.company}</p>
                    </div>
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${(job.analysis?.score || 0) > 80 ? 'text-emerald-500' : 'text-slate-200'}`} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
             <div className="relative z-10 space-y-4">
               <div className="bg-white text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="w-6 h-6" /></div>
               <h3 className="text-xl font-black">AI Strategy</h3>
               <p className="text-xs font-bold leading-relaxed opacity-80">Our vector analysis engine compares your document rendering against the latent requirements of recruiters.</p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeLab;