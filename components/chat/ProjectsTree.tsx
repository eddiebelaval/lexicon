'use client';

import { useEffect, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Calendar,
  Package,
  Film,
} from 'lucide-react';

interface ScriptScene {
  id: string;
  name: string;
  number: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface Script {
  id: string;
  name: string;
  sceneCount: number;
  completedScenes: number;
  scenes?: ScriptScene[];
}

interface Deadline {
  id: string;
  title: string;
  date: Date;
  type: 'script' | 'scene' | 'deliverable';
}

interface Deliverable {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
}

interface ProjectsTreeProps {
  universeId: string;
}

/**
 * Hierarchical view of production tracking
 * Universe → Scripts → Scenes
 * Also shows Deadlines and Deliverables
 *
 * Features:
 * - Expand/collapse sections
 * - Progress indicators
 * - Status badges
 * - Date formatting
 *
 * @example
 * <ProjectsTree universeId="universe-123" />
 */
export function ProjectsTree({ universeId }: ProjectsTreeProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['scripts', 'deadlines', 'deliverables'])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [universeId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const response = await fetch(`/api/projects?universeId=${universeId}`);
      // const data = await response.json();

      // Mock data for now
      setScripts([
        {
          id: 'script-1',
          name: 'Episode 1: The Beginning',
          sceneCount: 12,
          completedScenes: 8,
          scenes: [
            { id: 'scene-1', name: 'Opening Scene', number: 1, status: 'completed' },
            { id: 'scene-2', name: 'Introduction', number: 2, status: 'completed' },
            { id: 'scene-3', name: 'Conflict', number: 3, status: 'in_progress' },
          ],
        },
        {
          id: 'script-2',
          name: 'Episode 2: Rising Action',
          sceneCount: 15,
          completedScenes: 3,
        },
      ]);

      setDeadlines([
        {
          id: 'deadline-1',
          title: 'Script 1 Draft Due',
          date: new Date('2026-02-01'),
          type: 'script',
        },
        {
          id: 'deadline-2',
          title: 'Scene 5 Storyboard',
          date: new Date('2026-01-15'),
          type: 'scene',
        },
      ]);

      setDeliverables([
        {
          id: 'deliverable-1',
          title: 'Character Designs',
          status: 'completed',
          dueDate: new Date('2026-01-10'),
        },
        {
          id: 'deliverable-2',
          title: 'World Map',
          status: 'in_progress',
          dueDate: new Date('2026-01-20'),
        },
      ]);
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleScript = (scriptId: string) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(scriptId)) {
        next.delete(scriptId);
      } else {
        next.add(scriptId);
      }
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-vhs';
      case 'not_started':
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    return target.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vhs"></div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {/* Scripts Section */}
      <div className="space-y-1">
        <button
          onClick={() => toggleSection('scripts')}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors"
        >
          {expandedSections.has('scripts') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Film className="w-4 h-4" />
          <span>Scripts</span>
          <span className="ml-auto text-xs text-gray-500">
            {scripts.length}
          </span>
        </button>

        {expandedSections.has('scripts') && (
          <div className="ml-4 space-y-1">
            {scripts.map((script) => {
              const isExpanded = expandedScripts.has(script.id);
              const progress = (script.completedScenes / script.sceneCount) * 100;

              return (
                <div key={script.id} className="space-y-1">
                  <button
                    onClick={() => toggleScript(script.id)}
                    className="w-full flex items-start gap-2 px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors group"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <Folder className="w-4 h-4 mt-0.5 flex-shrink-0 text-vhs" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate">{script.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-vhs rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {script.completedScenes}/{script.sceneCount}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && script.scenes && (
                    <div className="ml-6 space-y-1">
                      {script.scenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{scene.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              scene.status === 'completed'
                                ? 'bg-green-400'
                                : scene.status === 'in_progress'
                                ? 'bg-vhs'
                                : 'bg-gray-600'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deadlines Section */}
      <div className="space-y-1">
        <button
          onClick={() => toggleSection('deadlines')}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors"
        >
          {expandedSections.has('deadlines') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Calendar className="w-4 h-4" />
          <span>Deadlines</span>
          <span className="ml-auto text-xs text-gray-500">
            {deadlines.length}
          </span>
        </button>

        {expandedSections.has('deadlines') && (
          <div className="ml-4 space-y-1">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-start gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-vhs" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{deadline.title}</div>
                  <div className="text-gray-500 mt-0.5">
                    {formatDate(deadline.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliverables Section */}
      <div className="space-y-1">
        <button
          onClick={() => toggleSection('deliverables')}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors"
        >
          {expandedSections.has('deliverables') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Package className="w-4 h-4" />
          <span>Deliverables</span>
          <span className="ml-auto text-xs text-gray-500">
            {deliverables.length}
          </span>
        </button>

        {expandedSections.has('deliverables') && (
          <div className="ml-4 space-y-1">
            {deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="flex items-start gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-vhs" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{deliverable.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={getStatusColor(deliverable.status)}>
                      {deliverable.status.replace('_', ' ')}
                    </span>
                    {deliverable.dueDate && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500">
                          {formatDate(deliverable.dueDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
