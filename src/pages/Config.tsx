import React, { useState, useEffect } from 'react';
import type { PromptConfig, ContactTone } from '../types';
import { DEFAULT_PROMPT_CONFIG, generateSystemPrompt } from '../types';

export default function Config() {
  const [config, setConfig] = useState<PromptConfig>(DEFAULT_PROMPT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [promptManuallyEdited, setPromptManuallyEdited] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config/get');
      const data = await response.json();
      // Merge with defaults and ensure systemPrompt exists
      const merged = { ...DEFAULT_PROMPT_CONFIG, ...data };
      if (!merged.systemPrompt) {
        merged.systemPrompt = generateSystemPrompt(merged);
      }
      setConfig(merged);
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage('Fehler beim Laden der Konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Konfiguration erfolgreich gespeichert ✓');
      } else {
        setMessage(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Fehler beim Speichern der Konfiguration');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof PromptConfig>(key: K, value: PromptConfig[K]) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-regenerate prompt if not manually edited
      if (key !== 'systemPrompt' && !promptManuallyEdited) {
        updated.systemPrompt = generateSystemPrompt(updated);
      }
      return updated;
    });
  };

  const handlePromptChange = (value: string) => {
    setPromptManuallyEdited(true);
    setConfig((prev) => ({ ...prev, systemPrompt: value }));
  };

  const regeneratePrompt = () => {
    setPromptManuallyEdited(false);
    setConfig((prev) => ({ ...prev, systemPrompt: generateSystemPrompt(prev) }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Anruf-Konfiguration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Agent Settings */}
          <Section title="Agent-Einstellungen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  value={config.agentName}
                  onChange={(e) => updateField('agentName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kontaktton *
                </label>
                <select
                  required
                  value={config.contactTone}
                  onChange={(e) => updateField('contactTone', e.target.value as ContactTone)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                >
                  <option value="Formal">Formal (Sie)</option>
                  <option value="Casual">Casual (locker)</option>
                  <option value="Friendly">Freundlich (herzlich)</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Donor Information */}
          <Section title="Spender-Informationen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Spender Name *
                </label>
                <input
                  type="text"
                  required
                  value={config.donorName}
                  onChange={(e) => updateField('donorName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Spendenhistorie *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. 2 Jahre"
                  value={config.donationHistory}
                  onChange={(e) => updateField('donationHistory', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aktueller Betrag (€) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={config.currentAmount}
                  onChange={(e) => updateField('currentAmount', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ziel-Betrag (€) *
                </label>
                <input
                  type="number"
                  required
                  min={config.currentAmount + 1}
                  value={config.targetAmount}
                  onChange={(e) => updateField('targetAmount', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Zusätzliche Anweisungen
              </label>
              <textarea
                rows={2}
                value={config.additionalInstructions}
                onChange={(e) => updateField('additionalInstructions', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross"
                placeholder="Spezielle Taktiken oder Hinweise für den Agent..."
              />
            </div>
          </Section>

          {/* System Prompt */}
          <Section title="System Prompt">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">
                Der vollständige Prompt wird aus den obigen Feldern generiert.
                Sie können ihn hier direkt bearbeiten oder überschreiben.
              </p>
              <button
                type="button"
                onClick={regeneratePrompt}
                className="text-sm text-redcross hover:text-red-700 underline"
              >
                Neu generieren
              </button>
            </div>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              rows={16}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-redcross focus:ring-redcross font-mono text-sm leading-relaxed"
            />
            {promptManuallyEdited && (
              <p className="mt-1 text-xs text-amber-600">
                Prompt wurde manuell bearbeitet. Änderungen an den Feldern oben werden nicht automatisch übernommen.
              </p>
            )}
          </Section>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-redcross text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-redcross focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Speichert...' : 'Konfiguration speichern'}
            </button>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.includes('✓')
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
