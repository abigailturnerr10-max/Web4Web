import { FormField } from '../ContentFormUI.jsx'

export default function StepAnythingElse({ content, patch }) {
  return (
    <div className="cf-step">
      <FormField label="Anything else?" priority="optional">
        <textarea
          className="text-input"
          rows={5}
          placeholder="Reference sites you like, things you don't want, accessibility or language needs, anything not covered above."
          value={content.anything_else || ''}
          onChange={(e) => patch({ anything_else: e.target.value })}
        />
      </FormField>
    </div>
  )
}
