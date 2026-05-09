import { FileText } from 'lucide-react';

export default function CitationChip({ citation, index, onClick }) {
  return (
    <button
      onClick={() => onClick?.(citation)}
      className="
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        bg-primary-50 border border-primary-200
        text-primary-700 text-xs font-bold
        hover:bg-primary-100 hover:border-primary-300
        transition-all duration-200 cursor-pointer shadow-sm
      "
      title={`${citation.filename} — Page ${citation.page}\n\n${citation.text}`}
    >
      <FileText className="w-3 h-3 text-primary-500" />
      <span className="max-w-[120px] truncate">[{index + 1}] {citation.filename}</span>
      <span className="text-primary-500 font-black">p.{citation.page}</span>
    </button>
  );
}
