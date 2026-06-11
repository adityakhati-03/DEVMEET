import { useState } from 'react';
import { interviewService } from '../../services/interviewService';
import { XCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewerNotesModalProps {
  sessionId: string;
  initialNotes: string;
  onClose: () => void;
  onSaved: (notes: string) => void;
}

export default function InterviewerNotesModal({ sessionId, initialNotes, onClose, onSaved }: InterviewerNotesModalProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await interviewService.updateNotes(sessionId, notes);
      toast.success('Notes saved');
      onSaved(notes);
      onClose();
    } catch (e) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '600px', background: '#080a0f', borderRadius: '16px', border: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>Interviewer Notes</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <XCircle size={20} />
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Type your notes about the candidate here..."
            style={{ width: '100%', height: '200px', padding: '16px', background: '#1c1f26', border: '1px solid var(--dm-border)', color: 'white', borderRadius: '12px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 20px', background: '#34d399', color: '#080a0f', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
