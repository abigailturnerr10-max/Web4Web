import { FormField } from '../ContentFormUI.jsx'

export default function StepLegalContent({ content, patch }) {
  return (
    <div className="cf-step">
      <FormField label="Privacy Policy / Terms" priority="optional">
        <textarea
          className="text-input"
          rows={5}
          placeholder="Paste your own text here, or leave blank and we'll generate a standard one."
          value={content.legal_privacy_text || ''}
          onChange={(e) => patch({ legal_privacy_text: e.target.value })}
        />
      </FormField>

      <label className="cf-checkbox-row">
        <input
          type="checkbox"
          checked={content.legal_generate_standard}
          onChange={(e) => patch({ legal_generate_standard: e.target.checked })}
        />
        <span>Generate a standard Privacy Policy / Terms for us (default if left blank)</span>
      </label>
    </div>
  )
}
