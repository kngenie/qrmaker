import { LitElement, html, css } from 'lit';
import QRCodeStyling from 'qr-code-styling';
import { toQrOptions, SIZES } from '../lib/qr-options.js';
import { sharedStyles } from './shared-styles.js';

// The preview is drawn on a canvas at twice its display size and scaled down by CSS.
// (A scaled SVG shows hairline seams between modules at non-integer zoom levels.)
const PREVIEW_SIZE = 640;

/**
 * Live preview of the QR code plus download / copy buttons.
 * Everything is rendered in the browser; nothing is uploaded anywhere.
 */
export class QrPreview extends LitElement {
  static properties = {
    settings: { type: Object },
    data: { type: String },
    /** Human-readable form of `data` (e.g. without percent-encoding). */
    display: { type: String },
    _busy: { state: true },
    _message: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      :host { display: block; }
      .frame {
        aspect-ratio: 1;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        border-radius: var(--qr-radius-sm);
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .frame.checker {
        background-color: #fff;
        background-image:
          linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%),
          linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
      }
      #qr { width: 100%; height: 100%; }
      #qr canvas { width: 100%; height: 100%; display: block; }
      #qr[hidden] { display: none; }
      .placeholder {
        text-align: center;
        padding: 1.5rem;
        color: var(--qr-text-muted);
        border: 2px dashed var(--qr-border);
        border-radius: var(--qr-radius-sm);
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
      }
      .placeholder svg { width: 56px; height: 56px; opacity: 0.5; margin-bottom: 0.5rem; }
      .encoded {
        margin: 0.75rem 0 0;
        text-align: center;
        font-size: 0.85rem;
        color: var(--qr-text-muted);
        word-break: break-all;
      }
      .actions {
        display: grid;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .actions .row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .actions .row button { flex: 1 1 auto; }
      .download { font-size: 1.05rem; padding: 0.75rem 1.1rem; }
      .status { min-height: 1.4em; text-align: center; font-size: 0.9rem; margin: 0.5rem 0 0; }
    `,
  ];

  constructor() {
    super();
    this.settings = null;
    this.data = '';
    this.display = '';
    this._busy = false;
    this._message = '';
    this._qr = null;
  }

  render() {
    const ready = !!this.data;
    const size = SIZES.find((s) => s.value === this.settings?.size);
    return html`
      <div class="frame ${ready && this.settings?.transparent ? 'checker' : ''}">
        <div id="qr" ?hidden=${!ready}></div>
        ${ready
          ? ''
          : html`<div class="placeholder">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <path d="M14 14h3v3M21 14v.01M14 21h.01M17.5 21H21v-3.5" />
                </svg>
                <div>Your QR code will appear here</div>
              </div>
            </div>`}
      </div>
      ${ready ? html`<p class="encoded">Opens <strong>${this.display || this.data}</strong></p>` : ''}

      <div class="actions">
        <button class="primary download" ?disabled=${!ready || this._busy} @click=${() => this._download('png')}>
          Download image (PNG)
        </button>
        <div class="row">
          <button ?disabled=${!ready || this._busy} @click=${() => this._download('svg')}
            title="Sharp at any size — ideal for printers and designers">
            SVG for print
          </button>
          <button ?disabled=${!ready || this._busy} @click=${() => this._download('jpeg')}>JPEG</button>
          ${canCopyImage()
            ? html`<button ?disabled=${!ready || this._busy} @click=${this._copy}>Copy image</button>`
            : ''}
        </div>
        <p class="status muted" role="status">
          ${this._message || (ready && size ? `${size.label} size · ${size.hint}` : '')}
        </p>
      </div>
    `;
  }

  updated(changed) {
    if (!changed.has('settings') && !changed.has('data')) return;
    if (!this.data || !this.settings) return;
    const opts = toQrOptions(this.settings, this.data, PREVIEW_SIZE, { type: 'canvas' });
    if (this._qr) {
      this._qr.update(opts);
    } else {
      this._qr = new QRCodeStyling(opts);
      this._qr.append(this.renderRoot.querySelector('#qr'));
    }
  }

  /** A fresh instance at the final output size, so raster images are sharp. */
  _fullSize(extension) {
    return new QRCodeStyling(
      toQrOptions(this.settings, this.data, this.settings.size, { opaque: extension === 'jpeg' }),
    );
  }

  async _download(extension) {
    this._busy = true;
    this._message = '';
    try {
      await this._fullSize(extension).download({ name: fileName(this.data), extension });
      this._flash('Saved to your downloads.');
    } catch (err) {
      console.error(err);
      this._flash('Sorry, the image couldn’t be created. Please try again.');
    } finally {
      this._busy = false;
    }
  }

  async _copy() {
    this._busy = true;
    this._message = '';
    try {
      // Pass a promise so Safari keeps the user-gesture permission while the PNG renders.
      const blob = this._fullSize('png').getRawData('png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      this._flash('Copied! Paste it into your document or message.');
    } catch (err) {
      console.error(err);
      this._flash('Your browser didn’t allow copying. Try downloading instead.');
    } finally {
      this._busy = false;
    }
  }

  _flash(message) {
    this._message = message;
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => (this._message = ''), 4000);
  }
}

function canCopyImage() {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
}

/** e.g. "qr-example.com" for https://www.example.com/page */
function fileName(data) {
  try {
    const host = new URL(data).hostname.replace(/^www\./, '');
    if (host) return `qr-${host}`;
  } catch {
    /* fall through */
  }
  return 'qr-code';
}

customElements.define('qr-preview', QrPreview);
