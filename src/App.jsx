import { useState, useCallback, useMemo, useEffect } from 'react'
import './App.css'

function App() {
  const [hexCode, setHexCode] = useState('')
  const [bitSize, setBitSize] = useState(32)
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState('')

  const bitSizes = useMemo(() => [
    { value: 32, label: '32-bit', bytes: 4 },
    { value: 64, label: '64-bit', bytes: 8 },
    { value: 128, label: '128-bit', bytes: 16 }
  ], [])

  useEffect(() => {
    handleGenerate()
  }, []) 

  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [copyStatus])

  const generateHex = useCallback(async (bits) => {
    try {
      const bytes = bits / 8
      const buffer = new Uint8Array(bytes)
      
      await new Promise((resolve) => {
        const generate = () => {
          crypto.getRandomValues(buffer)
          resolve()
        }
        setTimeout(generate, 500)
      })

      return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
        .match(/.{1,4}/g)
        ?.join(' ') || ''

    } catch (err) {
      throw new Error('Failed to generate secure random values')
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    setSelectedMessage('')
    try {
      const newHex = await generateHex(bitSize)
      setHexCode(newHex)
      setGenerationCount(prev => prev + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }, [bitSize, generateHex])

  const handleCopy = useCallback(async () => {
    try {
      const cleanHex = hexCode.replace(/\s/g, '')
      await navigator.clipboard.writeText(cleanHex)
      setCopyStatus('success')
    } catch (err) {
      setCopyStatus('error')
      setError('Failed to copy to clipboard')
    }
  }, [hexCode])

  const handleBitSizeChange = useCallback((e) => {
    const newSize = Number(e.target.value)
    if (newSize && bitSizes.some(size => size.value === newSize)) {
      setBitSize(newSize)
      setError('')
      setSelectedMessage(`${newSize}-bit selected. Click Generate to create hex code.`)
    } else {
      setError('Invalid bit size selected')
    }
  }, [bitSizes])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleGenerate()
    }
  }, [handleGenerate])

  return (
    <div className="container">
      <h1 className="title">
        Hex Code Generator
        <span className="subtitle">Cryptographically Secure</span>
      </h1>
      
      <div className="controls">
        <select 
          value={bitSize} 
          onChange={handleBitSizeChange}
          aria-label="Select bit size"
          className="select-size"
        >
          {bitSizes.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        
        <button 
          onClick={handleGenerate}
          onKeyDown={handleKeyPress}
          aria-label="Generate new hex code"
          className={`generate-button ${isGenerating ? 'generating' : ''}`}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Hex Code'}
        </button>
      </div>

      {selectedMessage && (
        <div className="selected-message">
          {selectedMessage}
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {hexCode && (
        <div className={`result ${isGenerating ? 'fade-out' : 'fade-in'}`}>
          <h2>Generated Hex Code:</h2>
          <div className="hex-display">
            <code 
              className="hex-code" 
              title="Click to copy"
              onClick={handleCopy}
            >
              {hexCode}
            </code>
            <button 
              onClick={handleCopy}
              className={`copy-button ${copyStatus}`}
              aria-label="Copy hex code"
            >
              {copyStatus === 'success' ? '✓ Copied!' : 
               copyStatus === 'error' ? '✗ Failed' : 'Copy'}
            </button>
          </div>
          <div className="info">
            <p>Length: {hexCode.replace(/\s/g, '').length} characters ({bitSize} bits)</p>
            <p className="generation-count">Generation #{generationCount}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
