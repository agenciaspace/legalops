import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Contact, ContactStatus, pipelineStages } from '../data/contacts';

interface Props {
  contacts: Contact[];
  onMoveToStage: (contactId: string, stage: ContactStatus) => void;
  onOpenContact: (c: Contact) => void;
}

const stageColors: Record<ContactStatus, string> = {
  identified: '#64748b',
  connected: '#3b82f6',
  engaged: '#f59e0b',
  meeting: '#8b5cf6',
  partner: '#10b981',
};

export function Pipeline({ contacts, onMoveToStage, onOpenContact }: Props) {
  const getContactsByStage = (stage: ContactStatus): Contact[] => {
    return contacts.filter(c => c.status === stage);
  };

  const canMoveLeft = (stage: ContactStatus): boolean => {
    const currentIndex = pipelineStages.indexOf(stage);
    return currentIndex > 0;
  };

  const canMoveRight = (stage: ContactStatus): boolean => {
    const currentIndex = pipelineStages.indexOf(stage);
    return currentIndex < pipelineStages.length - 1;
  };

  const getPreviousStage = (stage: ContactStatus): ContactStatus | null => {
    const currentIndex = pipelineStages.indexOf(stage);
    return currentIndex > 0 ? (pipelineStages[currentIndex - 1] as ContactStatus) : null;
  };

  const getNextStage = (stage: ContactStatus): ContactStatus | null => {
    const currentIndex = pipelineStages.indexOf(stage);
    return currentIndex < pipelineStages.length - 1 ? (pipelineStages[currentIndex + 1] as ContactStatus) : null;
  };

  const handleMoveLeft = (contactId: string, stage: ContactStatus) => {
    const previousStage = getPreviousStage(stage);
    if (previousStage) {
      onMoveToStage(contactId, previousStage);
    }
  };

  const handleMoveRight = (contactId: string, stage: ContactStatus) => {
    const nextStage = getNextStage(stage);
    if (nextStage) {
      onMoveToStage(contactId, nextStage);
    }
  };

  const getSectorBadgeColor = (sector: string): string => {
    const sectorColors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Finance': 'bg-green-100 text-green-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Manufacturing': 'bg-yellow-100 text-yellow-800',
      'Energy': 'bg-orange-100 text-orange-800',
      'Real Estate': 'bg-purple-100 text-purple-800',
      'Consulting': 'bg-indigo-100 text-indigo-800',
      'Law': 'bg-slate-100 text-slate-800',
    };
    return sectorColors[sector] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="w-full overflow-x-auto bg-slate-50 p-6">
      <div className="flex gap-6 min-w-min">
        {pipelineStages.map((stage) => {
          const stageContacts = getContactsByStage(stage as ContactStatus);
          const stageColor = stageColors[stage as ContactStatus];

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-80 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Stage Header */}
              <div
                className="px-4 py-3 border-b border-slate-200"
                style={{ borderTopColor: stageColor, borderTopWidth: '3px' }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 capitalize">
                    {stage}
                  </h3>
                  <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                    {stageContacts.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {stageContacts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No contacts
                  </div>
                ) : (
                  stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => onOpenContact(contact)}
                      className="bg-white border border-slate-200 rounded-md p-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all"
                    >
                      {/* Card Header */}
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {contact.company}
                        </p>
                      </div>

                      {/* Score and Sector */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: stageColor }}
                        >
                          {contact.score}
                        </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSectorBadgeColor(
                            contact.sector
                          )}`}
                        >
                          {contact.sector}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLeft(contact.id, stage as ContactStatus);
                          }}
                          disabled={!canMoveLeft(stage as ContactStatus)}
                          className="flex-1 p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move to previous stage"
                        >
                          <ChevronLeft size={16} className="text-slate-600 mx-auto" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveRight(contact.id, stage as ContactStatus);
                          }}
                          disabled={!canMoveRight(stage as ContactStatus)}
                          className="flex-1 p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move to next stage"
                        >
                          <ChevronRight size={16} className="text-slate-600 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
