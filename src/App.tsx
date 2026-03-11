import { useState } from 'react';
import { Contact, ContactStatus, initialContacts } from './data/contacts';
import { Pipeline } from './components/Pipeline';

function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('legalops-contacts');
    return saved ? JSON.parse(saved) : initialContacts;
  });

  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem('legalops-contacts', JSON.stringify(updated));
  };

  const handleMoveToStage = (contactId: string, stage: ContactStatus) => {
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, status: stage } : c
    );
    saveContacts(updated);
  };

  const handleOpenContact = (contact: Contact) => {
    console.log('Open contact:', contact);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Legal Ops CRM</h1>
        <p className="text-sm text-slate-500">Pipeline Management</p>
      </header>
      <Pipeline
        contacts={contacts}
        onMoveToStage={handleMoveToStage}
        onOpenContact={handleOpenContact}
      />
    </div>
  );
}

export default App;
