import { LitElement, html, css } from 'lit';
import QRCodeStyling from 'qr-code-styling';
import { LOOKS } from '../lib/qr-options.js';
import { sharedStyles } from './shared-styles.js';

// Drawn on a canvas at 2x the display size; see the note in qr-preview.js.
const THUMB_SIZE = 128;
const SAMPLE_DATA = 'https://example.com/';

/**
 * A row of small sample codes, one per ready-made look.
 * Fires `look-change` with `detail: { look }` (a LOOKS entry).
 */
export class LookPicker extends LitElement {
  static properties = {
    value: { type: String },
    fg: { type: String },
  };

  static styles = [
    sharedStyles,
    css`
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 0.6rem;
      }
      button {
        border-radius: var(--qr-radius-sm);
        padding: 0.5rem 0.4rem 0.4rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.875rem;
      }
      button[aria-checked='true'] {
        border-color: var(--qr-primary);
        background: var(--qr-primary-soft);
        box-shadow: 0 0 0 1.5px var(--qr-primary) inset;
      }
      .thumb {
        width: 64px;
        height: 64px;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
      }
      .thumb canvas { width: 100%; height: 100%; display: block; }
    `,
  ];

  constructor() {
    super();
    this.value = 'rounded';
    this.fg = '#1c1714';
    this._thumbs = new Map();
  }

  render() {
    return html`
      <div class="grid" role="radiogroup" aria-label="Look" @keydown=${this._onKeydown}>
        ${LOOKS.map(
          (look) => html`
            <button
              role="radio"
              aria-checked=${look.id === this.value}
              tabindex=${look.id === this.value || (this.value === 'custom' && look === LOOKS[0]) ? 0 : -1}
              data-id=${look.id}
              @click=${() => this._select(look)}
            >
              <span class="thumb" id="thumb-${look.id}"></span>
              ${look.label}
            </button>
          `,
        )}
      </div>
    `;
  }

  updated(changed) {
    if (changed.has('fg')) this._drawThumbs();
  }

  _drawThumbs() {
    for (const look of LOOKS) {
      const opts = {
        type: 'canvas',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        margin: 6,
        data: SAMPLE_DATA,
        qrOptions: { errorCorrectionLevel: 'L' },
        dotsOptions: { type: look.dots, color: this.fg },
        cornersSquareOptions: { type: look.cornerSquare, color: this.fg },
        cornersDotOptions: { type: look.cornerDot, color: this.fg },
        backgroundOptions: { color: '#ffffff' },
      };
      let qr = this._thumbs.get(look.id);
      if (qr) {
        qr.update(opts);
      } else {
        qr = new QRCodeStyling(opts);
        qr.append(this.renderRoot.querySelector(`#thumb-${look.id}`));
        this._thumbs.set(look.id, qr);
      }
    }
  }

  _select(look) {
    this.dispatchEvent(new CustomEvent('look-change', { detail: { look }, bubbles: true, composed: true }));
  }

  // Arrow keys move between options, as in a native radio group.
  _onKeydown(e) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const i = Math.max(0, LOOKS.findIndex((l) => l.id === this.value));
    const next = LOOKS[(i + delta + LOOKS.length) % LOOKS.length];
    this._select(next);
    this.updateComplete.then(() => this.renderRoot.querySelector(`[data-id="${next.id}"]`)?.focus());
  }
}

customElements.define('look-picker', LookPicker);
