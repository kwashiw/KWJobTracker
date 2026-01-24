import React, { useState, useRef, useEffect } from 'react';
import { FileText, Sparkles, CheckCircle2, TrendingUp, AlertCircle, Info, Upload, Loader2, FileUp, Edit3, Eye } from 'lucide-react';
import { JobApplication, ResumeData } from '../types';

interface ResumeLabProps {
  resumeData: ResumeData;
  jobs: JobApplication[];
  onSaveResume: (data: ResumeData) => void;
  onUpdateJob: (id: string, updates: Partial<JobApplication>) => void;
}

const ResumeLab: React.FC<ResumeLabProps> = ({ resumeData, jobs, onSaveResume, onUpdateJob }) => {
  const [editing, setEditing] = useState(!resumeData.content);
  const [tempText, setTempText] = useState(resumeData.type === 'text' ? resumeData.content : '');
  const [isUploading, setIsUploading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set up PDF.js worker for text extraction
    // @ts-ignore
    if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }, []);

  // Effect to manage Blob URL lifecycle for PDF visualization
  useEffect(() => {
    if (resumeData.type === 'pdf' && resumeData.content) {
      try {
        // Convert DataURL back to Blob for cleaner iframe viewing
        const parts = resumeData.content.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Blob conversion error:", err);
      }
    } else {
      setBlobUrl(null);
    }
  }, [resumeData.content, resumeData.type]);

  const handleSaveText = () => {
    onSaveResume({
      type: 'text',
      content: tempText,
      extractedText: tempText
    });
    setEditing(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // @ts-ignore
      if (!window.pdfjsLib) {
        throw new Error("PDF Library not loaded correctly. Please refresh.");
      }
      
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(" ") + "\n";
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onSaveResume({
          type: 'pdf',
          content: event.target?.result as string, 
          extractedText: fullText
        });
        setEditing(false);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("PDF Parsing error:", err);
      alert("Failed to parse PDF. Please try again or copy-paste text.");
      setIsUploading(false);
    }
  };

  const analyzedJobs = jobs.filter(j => j.analysis).sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Career Engine</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">AI match scoring & technical prep</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handlePdfUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Upload Resume PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Resume Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                {resumeData.type === 'pdf' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />} 
                {resumeData.type === 'pdf' ? 'Formatted View' : 'Text Input'}
              </h3>
              <div className="flex items-center gap-2">
                {editing ? (
                  <button onClick={handleSaveText} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-700 transition-all">Save Changes</button>
                ) : (
                  <button onClick={() => { setTempText(resumeData.extractedText); setEditing(true); }} className="text-indigo-600 font-bold text-[10px] uppercase hover:bg-indigo-50 px-3 py-1.5 rounded-lg">Manual Fix</button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white relative min-h-[600px]">
              {editing ? (
                <textarea 
                  value={tempText}
                  onChange={e => setTempText(e.target.value)}
                  placeholder="Paste profile text here..."
                  className="w-full h-full min-h-[600px] p-8 bg-white border-none focus:ring-0 text-xs font-medium text-slate-700 resize-none outline-none"
                />
              ) : (
                <div className="w-full h-full min-h-[600px] flex flex-col">
                  {resumeData.type === 'pdf' && blobUrl ? (
                    <iframe 
                      src={blobUrl} 
                      className="w-full h-full min-h-[600px] border-none"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="p-8 h-full bg-white overflow-y-auto">
                      {resumeData.content ? (
                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                          {resumeData.content}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] text-center">
                          <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold text-sm max-w-xs">Upload your resume PDF to see the formatted document view here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-900 text-white/50 text-[8px] font-black uppercase tracking-[0.2em] text-center">
               Extracted Content Strength: {resumeData.extractedText.length} Characters
            </div>
          </div>
        </div>

        {/* Analytics Area */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Pipeline Scores</h3>
            {analyzedJobs.length === 0 ? (
              <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
                <p className="text-xs text-slate-400 font-bold leading-relaxed">Run a "Fit Check" in any job detail view to see comparative benchmarks here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyzedJobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-0.5">{job.analysis?.score}%</span>
                      <span className="text-[6px] font-black text-white uppercase tracking-widest">Fit</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-800 truncate">{job.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.company}</p>
                    </div>
                    <div className="shrink-0">
                       <CheckCircle2 className={`w-5 h-5 ${(job.analysis?.score || 0) > 80 ? 'text-emerald-500' : 'text-slate-200'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
             <div className="relative z-10 space-y-4">
               <div className="bg-white text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                 <Sparkles className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-black">Strategic Benchmarking</h3>
               <p className="text-xs font-bold leading-relaxed opacity-80">
                 Our system compares your profile against live job requirements. Aim for 80%+ compatibility before spending time on high-stakes interview prep.
               </p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeLab;