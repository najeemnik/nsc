import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Cloud, 
  Upload, 
  CheckCircle2, 
  FileText, 
  File, 
  Image, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { DocumentRecord } from '../../types';

interface DocumentsViewProps {
  onOpenAddDocument: () => void;
  onOpenGoogleDrive: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ 
  onOpenAddDocument,
  onOpenGoogleDrive 
}) => {
  const { 
    currentProject, 
    documents, 
    deleteDocument, 
    isGoogleDriveConnected, 
    uploadDocumentToDrive, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const projectDocs = documents.filter(d => d.projectId === currentProject?.id);

  const filteredDocs = projectDocs.filter(d => {
    const matchesSearch = 
      (d.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(projectDocs.map(d => d.category).filter(Boolean)));

  const handleSyncToDrive = async (doc: DocumentRecord) => {
    if (!isGoogleDriveConnected) {
      onOpenGoogleDrive();
      return;
    }
    setSyncingId(doc.id);
    try {
      await uploadDocumentToDrive(doc);
      alert(t('fileUploadedToDriveSuccess') || `"${doc.title}" was backed up to Google Drive!`);
    } catch (e: any) {
      alert(e.message || 'Failed to upload to Drive');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(t('confirmDeleteDocument') || `Are you sure you want to delete document "${title}"?`)) {
      deleteDocument(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>{t('projectDocuments') || 'Engineering Blueprints & Documents'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {t('documentsDesc') || 'Store architectural plans, municipal permits, soil tests, contracts, and backup on Google Drive'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGoogleDrive}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-bold transition"
          >
            <Cloud className="w-4 h-4" />
            <span>{t('googleDrive') || 'Google Drive Cloud'}</span>
          </button>

          <button
            onClick={onOpenAddDocument}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('uploadDocument') || 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchDocuments') || 'Search blueprint, permit, contract...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
        >
          <option value="all">{t('allCategories') || 'All Categories'}</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div 
            key={doc.id}
            className="p-6 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink line-clamp-1">{doc.title}</h3>
                    <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">{doc.category}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {doc.notes && (
                <p className="text-xs text-ink-muted mb-4 line-clamp-2">
                  {doc.notes}
                </p>
              )}

              <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                <div>{t('date') || 'Date'}: {doc.date}</div>
                {doc.fileSize && <div>{t('size') || 'Size'}: {doc.fileSize}</div>}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-800 rounded-xl transition"
                    title={t('view') || 'View File'}
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                )}
                {doc.googleDriveFileId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-bold rounded-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Drive</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => handleSyncToDrive(doc)}
                disabled={syncingId === doc.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                <Cloud className={`w-3.5 h-3.5 ${syncingId === doc.id ? 'animate-spin' : ''}`} />
                <span>{syncingId === doc.id ? 'Syncing...' : (t('backupToDrive') || 'Sync to Drive')}</span>
              </button>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            {t('noDocumentsFound') || 'No documents or blueprints uploaded yet'}
          </div>
        )}
      </div>
    </div>
  );
};
