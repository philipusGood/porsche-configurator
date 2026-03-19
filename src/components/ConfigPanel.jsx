import React, { useState } from 'react'
import { useCarStore } from '../store'

const BODY_COLOR_PRESETS = [
  { name: 'Guards Red', hex: '#CC2222' },
  { name: 'Speed Yellow', hex: '#F5C500' },
  { name: 'GT Silver', hex: '#8A8A8A' },
  { name: 'Arctic Silver', hex: '#C8C8C8' },
  { name: 'Midnight Blue', hex: '#1B2A6B' },
  { name: 'Racing Green', hex: '#2D5016' },
  { name: 'Black', hex: '#111111' },
  { name: 'Carrara White', hex: '#F0EEE8' },
]

export default function ConfigPanel() {
  const {
    bodyColor,
    setBodyColor,
    wheelColor,
    setWheelColor,
    wheelType,
    setWheelType,
    wheelSize,
    setWheelSize,
    liftHeight,
    setLiftHeight,
    spoiler,
    setSpoiler,
    hasStripe,
    setHasStripe,
    stripeColor,
    setStripeColor,
    hasRoofRack,
    setHasRoofRack,
    hasSafariLights,
    setHasSafariLights,
    hasSkidPlate,
    setHasSkidPlate,
  } = useCarStore()

  const [bodyColorInput, setBodyColorInput] = useState(bodyColor)
  const [wheelColorInput, setWheelColorInput] = useState(wheelColor)
  const [stripeColorInput, setStripeColorInput] = useState(stripeColor)

  const handleBodyColorChange = (hex) => {
    setBodyColor(hex)
    setBodyColorInput(hex)
  }

  const handleBodyColorInputChange = (e) => {
    const value = e.target.value
    setBodyColorInput(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setBodyColor(value)
    }
  }

  const handleWheelColorChange = (e) => {
    const value = e.target.value
    setWheelColorInput(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setWheelColor(value)
    }
  }

  const handleWheelColorPicker = (e) => {
    const value = e.target.value
    setWheelColorInput(value)
    setWheelColor(value)
  }

  const handleStripeColorChange = (e) => {
    const value = e.target.value
    setStripeColorInput(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setStripeColor(value)
    }
  }

  const handleStripeColorPicker = (e) => {
    const value = e.target.value
    setStripeColorInput(value)
    setStripeColor(value)
  }

  return (
    <div className="config-panel">
      <div className="panel-header">
        <div className="panel-title">996.1 SAFARI</div>
        <div className="panel-subtitle">Configurator</div>
      </div>

      <div className="panel-content">
        {/* PAINT Section */}
        <div className="config-section">
          <div className="section-title">Paint</div>

          <div className="color-swatches">
            {BODY_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                className={`color-swatch ${bodyColor === preset.hex ? 'active' : ''}`}
                style={{ backgroundColor: preset.hex }}
                onClick={() => handleBodyColorChange(preset.hex)}
                title={preset.name}
              />
            ))}
          </div>

          <div className="color-input-wrapper">
            <div className="color-input-box">
              <input
                type="color"
                value={bodyColor}
                onChange={(e) => handleBodyColorChange(e.target.value)}
              />
              <input
                type="text"
                value={bodyColorInput}
                onChange={handleBodyColorInputChange}
                placeholder="#XXXXXX"
              />
            </div>
          </div>

          {/* Stripe */}
          <div style={{ marginTop: '16px' }}>
            <button
              className={`toggle-button ${hasStripe ? 'active' : ''}`}
              onClick={() => setHasStripe(!hasStripe)}
            >
              {hasStripe ? '✓' : '○'} Racing Stripe
            </button>

            {hasStripe && (
              <div className="stripe-row">
                <div className="color-input-box">
                  <input
                    type="color"
                    value={stripeColor}
                    onChange={handleStripeColorPicker}
                  />
                  <input
                    type="text"
                    value={stripeColorInput}
                    onChange={handleStripeColorChange}
                    placeholder="#XXXXXX"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WHEELS Section */}
        <div className="config-section">
          <div className="section-title">Wheels</div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
            <div className="button-group three">
              <button
                className={`config-button ${wheelType === 'oem' ? 'active' : ''}`}
                onClick={() => setWheelType('oem')}
              >
                OEM
              </button>
              <button
                className={`config-button ${wheelType === 'fuchs' ? 'active' : ''}`}
                onClick={() => setWheelType('fuchs')}
              >
                Fuchs
              </button>
              <button
                className={`config-button ${wheelType === 'beadlock' ? 'active' : ''}`}
                onClick={() => setWheelType('beadlock')}
              >
                Beadlock
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Size</div>
            <div className="button-group three">
              <button
                className={`config-button ${wheelSize === 17 ? 'active' : ''}`}
                onClick={() => setWheelSize(17)}
              >
                17"
              </button>
              <button
                className={`config-button ${wheelSize === 18 ? 'active' : ''}`}
                onClick={() => setWheelSize(18)}
              >
                18"
              </button>
              <button
                className={`config-button ${wheelSize === 19 ? 'active' : ''}`}
                onClick={() => setWheelSize(19)}
              >
                19"
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Color</div>
            <div className="color-input-wrapper">
              <div className="color-input-box">
                <input
                  type="color"
                  value={wheelColor}
                  onChange={handleWheelColorPicker}
                />
                <input
                  type="text"
                  value={wheelColorInput}
                  onChange={handleWheelColorChange}
                  placeholder="#XXXXXX"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUSPENSION Section */}
        <div className="config-section">
          <div className="section-title">Suspension</div>

          <div className="button-group three">
            <button
              className={`config-button ${liftHeight === 0 ? 'active' : ''}`}
              onClick={() => setLiftHeight(0)}
            >
              Stock
            </button>
            <button
              className={`config-button ${liftHeight === 1 ? 'active' : ''}`}
              onClick={() => setLiftHeight(1)}
            >
              Mild
            </button>
            <button
              className={`config-button ${liftHeight === 2 ? 'active' : ''}`}
              onClick={() => setLiftHeight(2)}
            >
              Safari
            </button>
          </div>
        </div>

        {/* SPOILER Section */}
        <div className="config-section">
          <div className="section-title">Spoiler</div>

          <div className="button-group four">
            <button
              className={`config-button ${spoiler === 'none' ? 'active' : ''}`}
              onClick={() => setSpoiler('none')}
            >
              None
            </button>
            <button
              className={`config-button ${spoiler === 'stock' ? 'active' : ''}`}
              onClick={() => setSpoiler('stock')}
            >
              Stock
            </button>
            <button
              className={`config-button ${spoiler === 'ducktail' ? 'active' : ''}`}
              onClick={() => setSpoiler('ducktail')}
            >
              Ducktail
            </button>
            <button
              className={`config-button ${spoiler === 'whaletail' ? 'active' : ''}`}
              onClick={() => setSpoiler('whaletail')}
            >
              Whaletail
            </button>
          </div>
        </div>

        {/* ACCESSORIES Section */}
        <div className="config-section">
          <div className="section-title">Accessories</div>

          <button
            className={`toggle-button ${hasRoofRack ? 'active' : ''}`}
            onClick={() => setHasRoofRack(!hasRoofRack)}
          >
            {hasRoofRack ? '✓' : '○'} Roof Rack
          </button>

          <button
            className={`toggle-button ${hasSafariLights ? 'active' : ''}`}
            onClick={() => setHasSafariLights(!hasSafariLights)}
            style={{ marginTop: '8px' }}
          >
            {hasSafariLights ? '✓' : '○'} Safari Lights
          </button>

          <button
            className={`toggle-button ${hasSkidPlate ? 'active' : ''}`}
            onClick={() => setHasSkidPlate(!hasSkidPlate)}
            style={{ marginTop: '8px' }}
          >
            {hasSkidPlate ? '✓' : '○'} Skid Plate
          </button>
        </div>
      </div>
    </div>
  )
}
