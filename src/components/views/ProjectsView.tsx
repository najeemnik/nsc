import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Users, 
  Receipt, 
  PieChart, 
  ExternalLink,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';
import { Project } from '../../types';

interface ProjectsViewProps {
  onOpenNewProject: () => void;
  onOpenEditProject: (project: Project) => void;
  onOpenPartners: (project: Project) => void;
  onOpenTransfer?: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenNewProject,
  onOpenEditProject,
  onOpenPartners,
  onOpenTransfer
}) => {
  const { 
    projects, 
    currentProject, 
    setCurrentProjectId, 
    deleteProject, 
    formatCurrency, 
    t, 
    language 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert(t('cannotDeleteOnlyProject') || 'You cannot delete the only project in the system.');
      return;
    }
    if (confirm(t('confirmDeleteProject') || `Are you sure you want to delete "${project.name}"?`)) {
      deleteProject(project.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{t('buildingProjects') || 'Building Projects'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('manageProjectsDesc') || 'Manage multi-story buildings, residential complexes, and commercial towers'}
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newProject') || 'New Building Project'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'all' 
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t('allProjects') || 'All'} ({projects.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'active' 
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t('active') || 'Under Construction'}
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'completed' 
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t('completed') || 'Completed'}
        </button>
        <button
          onClick={() => setFilter('on_hold')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'on_hold' 
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t('onHold') || 'On Hold'}
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => {
          const isSelected = currentProject?.id === project.id;
          return (
            <div
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                isSelected 
                  ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  {t('activeProject') || 'Selected'}
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {project.name}
                      </h3>
                      {project.code && (
                        <p className="text-xs font-mono text-slate-400">{project.code}</p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {project.description || project.address || t('noDescription')}
                </p>

                {/* Current Owner Badge */}
                <div className="flex items-center justify-between gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-3 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {language === 'en' ? 'Owner: ' : 'مالک فعلی: '}
                      <strong>{project.currentOwner || project.clientOwner || (language === 'en' ? 'Initial Owner' : 'مالک اولیه')}</strong>
                    </span>
                  </div>
                  {project.transferHistory && project.transferHistory.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                      {project.transferHistory.length} {language === 'en' ? 'transfers' : 'واگذاری'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
                  {project.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  )}
                  {project.floorsCount && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{project.floorsCount} {t('floors')} • {project.unitsCount || 0} {t('apartments')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t('startDate')}: {project.startDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  {onOpenTransfer && (
                    <button
                      onClick={() => onOpenTransfer(project)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition"
                      title={language === 'en' ? 'Transfer & Handover Project' : 'انتقال و واگذاری پروژه'}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenPartners(project)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition"
                    title={t('partnersInvestors') || 'Partners & Investors'}
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenEditProject(project)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition"
                    title={t('edit') || 'Edit Project'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(project, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition"
                    title={t('delete') || 'Delete Project'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentProjectId(project.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isSelected 
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isSelected ? t('selected') || 'Active' : t('select') || 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
