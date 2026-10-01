import React, { useState } from 'react';
import { FileCheck, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

interface PrepChecklistProps {
  serviceName: string;
  requiredDocs: string[];
  preliminaryWarning?: string;
}

export const PrepChecklist: React.FC<PrepChecklistProps> = ({
  serviceName,
  requiredDocs,
  preliminaryWarning,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (doc: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [doc]: !prev[doc],
    }));
  };

  const completedCount = requiredDocs.filter((d) => checkedItems[d]).length;
  const isAllReady = requiredDocs.length > 0 && completedCount === requiredDocs.length;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Document Checklist</h3>
            <p className="text-xs text-slate-400">Preparation required for {serviceName}</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${
            isAllReady
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {completedCount} of {requiredDocs.length} Ready
        </span>
      </div>

      {preliminaryWarning && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{preliminaryWarning}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {requiredDocs.map((doc, idx) => {
          const isChecked = !!checkedItems[doc];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleCheck(doc)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                isChecked
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <span className={`text-sm font-medium ${isChecked ? 'line-through opacity-90' : ''}`}>
                  {doc}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {isChecked ? 'Prepared' : 'Required'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
