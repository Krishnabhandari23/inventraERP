'use client';
import { useState, useEffect } from 'react';
import { getInvisCapabilities, sendToInvis } from '@/lib/invis';
import { InvisReply, InvisCapability } from '@/lib/types';

interface Message {
  role: 'user' | 'invis';
  text?: string;
  capability?: InvisCapability[];
  detailRequest?: {
    action: string;
    missingFields: Array<{ name: string; type: string; description: string }>;
    extractedData: Record<string, any>;
  };
}

export function InvisPanel() {
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [capabilities, setCapabilities] = useState<InvisCapability[]>([]);
  const [showCapabilities, setShowCapabilities] = useState(true);
  const [detailFormData, setDetailFormData] = useState<Record<string, any>>({});

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const capabilities = await getInvisCapabilities();
        setCapabilities(capabilities);
      } catch (error) {
        console.error('Failed to load capabilities:', error);
      }
    };
    loadCapabilities();
  }, []);

  const send = async () => {
    if (!q.trim() || isSending) return;
    const userMsg = q.trim();
    setMsgs(m => [...m, { role: 'user', text: userMsg }]);
    setShowCapabilities(false);
    setQ('');
    setIsSending(true);
    setDetailFormData({});

    try {
      const replies = await sendToInvis(userMsg);
      replies.forEach((r: InvisReply) => {
        if (r.kind === 'TEXT') {
          setMsgs(m => [...m, { role: 'invis', text: r.text }]);
        }
        if (r.kind === 'CAPABILITY') {
          setMsgs(m => [...m, { role: 'invis', capability: r.capabilities }]);
        }
        if (r.kind === 'DETAIL_REQUEST') {
          setMsgs(m => [...m, { role: 'invis', detailRequest: r }]);
          setDetailFormData(r.extractedData);
        }
        if (r.kind === 'SUGGESTION') {
          setMsgs(m => [...m, { role: 'invis', text: `💡 ${r.title}${r.details ? ' — ' + r.details : ''}` }]);
        }
        if (r.kind === 'ACTION_EXECUTED') {
          setMsgs(m => [...m, { role: 'invis', text: `✅ ${r.summary}${r.details ? ' — ' + r.details : ''}` }]);
        }
        if (r.kind === 'ERROR') {
          setMsgs(m => [...m, { role: 'invis', text: `⚠️ ${r.message}` }]);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Invis error';
      setMsgs(m => [...m, { role: 'invis', text: `⚠️ ${message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDetailSubmit = async (detailRequest: any) => {
    // Combine extracted data with form data
    const completeParams = { ...detailRequest.extractedData, ...detailFormData };
    const confirmMsg = `Confirmed: ${detailRequest.action} with ${JSON.stringify(completeParams)}`;
    
    setMsgs(m => [...m, { role: 'user', text: confirmMsg }]);
    setDetailFormData({});
    setIsSending(true);

    try {
      // Send a follow-up message with the complete details
      const detailMessage = `${detailRequest.action}: ${JSON.stringify(completeParams)}`;
      const replies = await sendToInvis(detailMessage);
      
      replies.forEach((r: InvisReply) => {
        if (r.kind === 'TEXT') {
          setMsgs(m => [...m, { role: 'invis', text: r.text }]);
        }
        if (r.kind === 'ACTION_EXECUTED') {
          setMsgs(m => [...m, { role: 'invis', text: `✅ ${r.summary}${r.details ? ' — ' + r.details : ''}` }]);
        }
        if (r.kind === 'ERROR') {
          setMsgs(m => [...m, { role: 'invis', text: `⚠️ ${r.message}` }]);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMsgs(m => [...m, { role: 'invis', text: `⚠️ ${message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCapabilityClick = (capability: InvisCapability) => {
    setQ(capability.example);
    setShowCapabilities(false);
  };

  return (
    <div className="rounded-2xl p-4 shadow-glass [background:var(--glass-bg)] [border:1px_solid_var(--glass-br)] backdrop-blur-12 h-[720px] flex flex-col">
      <div className="text-sm font-medium mb-2">invis — your AI co-worker</div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Show capabilities initially */}
        {showCapabilities && capabilities.length > 0 && msgs.length === 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-textc-secondary opacity-70 uppercase">
              What I can do for you
            </div>
            <div className="grid gap-2">
              {capabilities.map((cap) => (
                <button
                  key={cap.id}
                  onClick={() => handleCapabilityClick(cap)}
                  className="text-left p-3 rounded-lg bg-bg-elevated hover:bg-bg-hover border border-borderc-soft hover:border-borderc-strong transition-all text-sm cursor-pointer group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{cap.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-textc-primary">{cap.name}</div>
                      <div className="text-xs text-textc-secondary mt-0.5">{cap.description}</div>
                      <div className="text-xs text-textc-secondary opacity-60 mt-1 italic">
                        e.g., "{cap.example}"
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`${
              m.role === 'user'
                ? 'text-textc-primary bg-bg-elevated rounded-lg p-2 pl-3'
                : 'text-textc-secondary'
            } text-sm`}
          >
            {m.role === 'user' && m.text && (
              <div className="flex gap-2">
                <span className="text-xs mr-2 opacity-60 font-medium">You</span>
                <span>{m.text}</span>
              </div>
            )}

            {m.role === 'invis' && m.text && (
              <div className="flex gap-2">
                <span className="text-xs mr-2 opacity-60 font-medium">invis</span>
                <span>{m.text}</span>
              </div>
            )}

            {m.role === 'invis' && m.capability && (
              <div className="space-y-2 mt-2">
                <div className="text-xs font-semibold text-textc-secondary opacity-70 uppercase">
                  Available Capabilities
                </div>
                <div className="grid gap-2">
                  {m.capability.map((cap) => (
                    <button
                      key={cap.id}
                      onClick={() => handleCapabilityClick(cap)}
                      className="text-left p-2 rounded-lg bg-bg-elevated hover:bg-bg-hover border border-borderc-soft hover:border-borderc-strong transition-all text-xs cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base">{cap.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-textc-primary">{cap.name}</div>
                          <div className="text-xs text-textc-secondary mt-0.5">{cap.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {m.role === 'invis' && m.detailRequest && (
              <div className="mt-2 space-y-3">
                <div className="text-xs font-semibold text-textc-primary">
                  I need more details to complete your request:
                </div>
                <div className="space-y-2 bg-bg-elevated rounded-lg p-3">
                  {m.detailRequest.missingFields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <label className="text-xs font-medium text-textc-primary block">
                        {field.name}
                        <span className="text-textc-secondary text-xs font-normal ml-1">
                          ({field.type})
                        </span>
                      </label>
                      <p className="text-xs text-textc-secondary mb-1">{field.description}</p>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={detailFormData[field.name] || ''}
                        onChange={(e) =>
                          setDetailFormData((prev) => ({
                            ...prev,
                            [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        placeholder={`Enter ${field.name}`}
                        className="w-full px-2 py-1.5 rounded-md border border-borderc-soft bg-bg-primary text-textc-primary text-xs outline-none focus:border-borderc-strong"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => handleDetailSubmit(m.detailRequest)}
                    disabled={isSending || m.detailRequest.missingFields.some(f => !detailFormData[f.name])}
                    className="w-full mt-3 px-3 py-1.5 text-xs rounded-md text-white bg-[color:var(--color-brand-solid)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
                  >
                    Confirm & Execute
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Describe what you need to do..."
          className="flex-1 rounded-lg border border-borderc-soft bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-borderc-strong"
        />
        <button
          onClick={send}
          disabled={isSending}
          className="px-3 py-2 text-sm rounded-md text-white bg-[color:var(--color-brand-solid)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
