import { useState } from 'react'

/**
 * Placeholder proof-of-payment upload for the manual bank transfer path.
 * No real backend yet — captures the filename locally so the flow reads
 * correctly end to end; wiring to actual admin notification is a follow-up.
 */
export default function ManualTransferUpload() {
  const [fileName, setFileName] = useState(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    setFileName(file ? file.name : null)
  }

  return (
    <div className="manual-transfer-upload">
      <p className="info-block__hint">
        Your site will display your bank details. When a customer transfers, they upload a screenshot of the proof
        of payment right there — it's sent straight to you so you can confirm and fulfil the order.
      </p>
      <label className="manual-transfer-upload__field">
        <input type="file" accept="image/*" onChange={handleChange} />
        <span>{fileName ? `Selected: ${fileName}` : 'Preview the upload step (optional)'}</span>
      </label>
    </div>
  )
}
