import { LitElement, html, css } from 'lit';
import {
  DEFAULT_SETTINGS,
  LOOKS,
  DOT_SHAPES,
  CORNER_SQUARE_SHAPES,
  CORNER_DOT_SHAPES,
  STURDINESS,
  BORDERS,
  SIZES,
  FG_SWATCHES,
  BG_SWATCHES,
  normalizeUrl,
  byteLength,
  colorWarning,
} from '../lib/qr-options.js';
import { loadSaved, storeSaved, newId, MAX_SAVED_LOGO_CHARS } from '../lib/storage.js';
import { sharedStyles } from './shared-styles.js';
import './look-picker.js';
import './color-picker.js';
import './qr-preview.js';
import './saved-list.js';

/** Addresses longer than this make dense codes that are harder to scan. */
const LONG_URL_BYTES = 300;
const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;
const LOGO_MAX_PX = 256;

export class QrApp extends LitElement {
  static properties = {
    _settings: { state: true },
    _saved: { state: true },
    _saveName: { state: true },
    _saveMessage: { state: true },
    _logoMessage: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      :host { display: block; }
      header {
        max-width: 1080px;
        margin: 0 auto;
        padding: 2rem 1rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.9rem;
      }
      header img { width: 48px; height: 48px; }
      h1 { margin: 0; font-size: 1.75rem; line-height: 1.2; }
      header p { margin: 0.15rem 0 0; }

      main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 0 1rem 2rem;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 1.25rem;
        align-items: start;
      }
      .col { display: grid; gap: 1.25rem; min-width: 0; }
      .sticky { position: sticky; top: 1rem; }
      @media (max-width: 820px) {
        main { grid-template-columns: minmax(0, 1fr); }
        .sticky { position: static; }
        /* Show the preview right after the address on small screens. */
        .preview-col { order: -1; }
      }

      .field + .field { margin-top: 1.1rem; }
      .hint { font-size: 0.85rem; color: var(--qr-text-muted); margin: 0.35rem 0 0; }
      .url-input { font-size: 1.1rem; }

      details {
        margin-top: 1.25rem;
        border-top: 1px solid var(--qr-border);
        padding-top: 0.75rem;
      }
      summary {
        cursor: pointer;
        font-weight: 600;
        color: var(--qr-primary);
        padding: 0.25rem 0;
      }
      summary:focus-visible { outline: 3px solid var(--qr-focus); outline-offset: 2px; border-radius: 4px; }
      .details-body { padding-top: 0.75rem; }
      .choices.with-hints button { display: flex; flex-direction: column; align-items: flex-start; border-radius: var(--qr-radius-sm); text-align: left; }
      .choices.with-hints button small { font-weight: 400; color: var(--qr-text-muted); font-size: 0.8rem; }
      .shapes { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; }
      .shapes label { font-weight: 600; font-size: 0.9rem; }

      .logo-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
      .logo-row img {
        width: 48px; height: 48px; object-fit: contain;
        border: 1px solid var(--qr-border); border-radius: 8px; background: #fff;
      }
      .file-button {
        margin: 0;
        cursor: pointer;
        border-radius: 999px;
        border: 1.5px solid var(--qr-border);
        background: var(--qr-surface);
        padding: 0.55rem 1.1rem;
      }
      .file-button:hover { background: var(--qr-surface-2); }
      .file-button:focus-within { outline: 3px solid var(--qr-focus); outline-offset: 2px; }
      .file-button input { position: absolute; width: 1px; height: 1px; opacity: 0; }

      .save-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
      .save-row input { flex: 1; min-width: 0; }
      .save-row button { flex: none; }

      footer {
        max-width: 1080px;
        margin: 0 auto;
        padding: 0 1rem 2.5rem;
        text-align: center;
        font-size: 0.875rem;
        color: var(--qr-text-muted);
      }
      footer .privacy {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
        background: var(--qr-surface-2);
        border-radius: 999px;
        padding: 0.45rem 1rem;
      }
    `,
  ];

  constructor() {
    super();
    this._settings = { ...DEFAULT_SETTINGS };
    this._saved = loadSaved();
    this._saveName = '';
    this._saveMessage = '';
    this._logoMessage = '';
  }

  _set(patch) {
    this._settings = { ...this._settings, ...patch };
  }

  /** The text to encode plus any problem with it. */
  _analyze() {
    const s = this._settings;
    const { value, data, error } = normalizeUrl(s.url);
    if (error) return { data: '', error };
    if (!data) return { data: '' };
    const bytes = byteLength(data);
    const level = STURDINESS.find((l) => l.value === s.ecl);
    if (bytes > level.bytes) {
      return {
        data: '',
        error: `This address is too long to fit in a QR code${s.ecl !== 'L' ? ' at this sturdiness level' : ''}. Try a shorter link.`,
      };
    }
    if (bytes > LONG_URL_BYTES) {
      return {
        data,
        display: value,
        warning: 'This is a long address, so the code will be very detailed and harder to scan. A shorter link will work better, especially in print.',
      };
    }
    return { data, display: value };
  }

  render() {
    const s = this._settings;
    const { data, display, error, warning } = this._analyze();
    const contrast = colorWarning(s);

    return html`
      <header>
        <img src="/favicon.svg" alt="" />
        <div>
          <h1>QR Maker</h1>
          <p class="muted">Turn any web address into a QR code people can scan with their phone.</p>
        </div>
      </header>

      <main>
        <div class="col">
          <section class="card" aria-labelledby="h-url">
            <h2 id="h-url"><span class="step">1</span> Where should the code take people?</h2>
            <label for="url" class="visually-hidden">Web address</label>
            <input
              id="url"
              class="url-input"
              type="url"
              inputmode="url"
              autocomplete="url"
              autocapitalize="off"
              spellcheck="false"
              placeholder="example.com/menu"
              .value=${s.url}
              @input=${(e) => this._set({ url: e.target.value })}
              aria-describedby="url-hint"
              aria-invalid=${!!error}
            />
            <p class="hint" id="url-hint">Type or paste a web address. We’ll add <em>https://</em> if you leave it off.</p>
            ${error ? html`<p class="note error" role="alert">${error}</p>` : ''}
            ${warning ? html`<p class="note warn">${warning}</p>` : ''}
          </section>

          <section class="card" aria-labelledby="h-style">
            <h2 id="h-style"><span class="step">2</span> Pick a look</h2>
            <div class="field">
              <look-picker .value=${s.look} .fg=${s.fg} @look-change=${this._onLook}></look-picker>
            </div>
            <div class="field">
              <color-picker
                label="Code color"
                .swatches=${FG_SWATCHES}
                .value=${s.fg}
                @color-change=${(e) => this._set({ fg: e.detail.color })}
              ></color-picker>
            </div>
            <div class="field">
              <color-picker
                label="Background"
                allow-transparent
                .swatches=${BG_SWATCHES}
                .value=${s.bg}
                .transparent=${s.transparent}
                @color-change=${(e) => this._set({ bg: e.detail.color, transparent: e.detail.transparent })}
              ></color-picker>
            </div>
            ${contrast ? html`<p class="note warn">${contrast}</p>` : ''}
          </section>

          <section class="card" aria-labelledby="h-details">
            <h2 id="h-details"><span class="step">3</span> Finishing touches</h2>
            <div class="field">
              <div class="label" id="lbl-size">Image size</div>
              <div class="choices with-hints" role="group" aria-labelledby="lbl-size">
                ${SIZES.map(
                  (o) => html`<button aria-pressed=${s.size === o.value} @click=${() => this._set({ size: o.value })}>
                    ${o.label}<small>${o.hint}</small>
                  </button>`,
                )}
              </div>
            </div>

            <div class="field">
              <div class="label">Logo in the middle <span class="muted small">(optional)</span></div>
              <div class="logo-row">
                ${s.logo ? html`<img src=${s.logo} alt="Your logo" />` : ''}
                <label class="file-button">
                  <input type="file" accept="image/*" @change=${this._onLogoFile} />
                  ${s.logo ? 'Change image' : 'Choose image…'}
                </label>
                ${s.logo ? html`<button class="link" @click=${this._removeLogo}>Remove</button>` : ''}
              </div>
              <p class="hint">Your image stays on this device. Simple logos with few details work best.</p>
              ${this._logoMessage ? html`<p class="note warn">${this._logoMessage}</p>` : ''}
            </div>

            <details>
              <summary>More options</summary>
              <div class="details-body">
                <div class="field">
                  <div class="label" id="lbl-ecl">How sturdy should it be?</div>
                  <div class="choices with-hints" role="group" aria-labelledby="lbl-ecl">
                    ${STURDINESS.map(
                      (o) => html`<button aria-pressed=${s.ecl === o.value} @click=${() => this._set({ ecl: o.value })}>
                        ${o.label}<small>${o.hint}</small>
                      </button>`,
                    )}
                  </div>
                  <p class="hint">Sturdier codes can still be read when part of them is damaged or covered, but have a busier pattern.</p>
                </div>

                <div class="field">
                  <div class="label" id="lbl-border">Blank space around the code</div>
                  <div class="choices" role="group" aria-labelledby="lbl-border">
                    ${BORDERS.map(
                      (o) => html`<button aria-pressed=${s.border === o.value} @click=${() => this._set({ border: o.value })}>
                        ${o.label}
                      </button>`,
                    )}
                  </div>
                  <p class="hint">Phones read codes more easily with some blank space around them.</p>
                </div>

                <div class="field">
                  <div class="label">Shapes</div>
                  <div class="shapes">
                    ${this._shapeSelect('dots', 'Dots', DOT_SHAPES)}
                    ${this._shapeSelect('cornerSquare', 'Corner frames', CORNER_SQUARE_SHAPES)}
                    ${this._shapeSelect('cornerDot', 'Corner centers', CORNER_DOT_SHAPES)}
                  </div>
                </div>

                <div class="field">
                  <button class="link" @click=${this._resetStyle}>Reset style to defaults</button>
                </div>
              </div>
            </details>
          </section>

          <section class="card" aria-labelledby="h-saved">
            <h2 id="h-saved">Saved settings</h2>
            <div class="save-row">
              <label for="save-name" class="visually-hidden">Name for these settings</label>
              <input
                id="save-name"
                type="text"
                placeholder=${this._defaultName(data) || 'Give it a name'}
                .value=${this._saveName}
                @input=${(e) => (this._saveName = e.target.value)}
                @keydown=${(e) => e.key === 'Enter' && this._save(data)}
              />
              <button class="primary" @click=${() => this._save(data)}>Save these settings</button>
            </div>
            ${this._saveMessage ? html`<p class="note warn" role="status">${this._saveMessage}</p>` : ''}
            <saved-list
              .entries=${this._saved}
              @saved-load=${this._onLoad}
              @saved-delete=${this._onDelete}
            ></saved-list>
            <p class="hint">Saved only in this browser on this device.</p>
          </section>
        </div>

        <div class="col preview-col">
          <section class="card sticky" aria-label="Your QR code">
            <qr-preview .settings=${s} .data=${data} .display=${display}></qr-preview>
          </section>
        </div>
      </main>

      <footer>
        <span class="privacy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Your codes are made right here in your browser. Nothing you enter is sent to or stored on a server.
        </span>
      </footer>
    `;
  }

  _shapeSelect(key, label, options) {
    return html`
      <div>
        <label for="shape-${key}">${label}</label>
        <select id="shape-${key}" @change=${(e) => this._set({ [key]: e.target.value, look: 'custom' })}>
          ${options.map((o) => html`<option value=${o.value} ?selected=${this._settings[key] === o.value}>${o.label}</option>`)}
        </select>
      </div>
    `;
  }

  _onLook(e) {
    const { id, dots, cornerSquare, cornerDot } = e.detail.look;
    this._set({ look: id, dots, cornerSquare, cornerDot });
  }

  _resetStyle() {
    const { url, logo } = this._settings;
    this._settings = { ...DEFAULT_SETTINGS, url, logo };
  }

  async _onLogoFile(e) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;
    this._logoMessage = '';
    if (!file.type.startsWith('image/')) {
      this._logoMessage = 'Please choose an image file (PNG, JPEG, SVG…).';
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      this._logoMessage = 'That image is too large. Please choose one under 5 MB.';
      return;
    }
    try {
      const logo = await shrinkImage(file, LOGO_MAX_PX);
      const patch = { logo };
      // A logo covers part of the code, so it needs extra error correction.
      if (this._settings.ecl === 'L' || this._settings.ecl === 'M') {
        patch.ecl = 'H';
        this._logoMessage = 'We made the code “Extra sturdy” so it still scans with a logo covering part of it.';
      }
      this._set(patch);
    } catch {
      this._logoMessage = 'Sorry, that image couldn’t be read. Try a different file.';
    }
  }

  _removeLogo() {
    this._logoMessage = '';
    this._set({ logo: null });
  }

  _defaultName(data) {
    try {
      return new URL(data).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  _save(data) {
    const name = this._saveName.trim() || this._defaultName(data) || `Settings ${this._saved.length + 1}`;
    let settings = { ...this._settings };
    let note = '';
    if (settings.logo && settings.logo.length > MAX_SAVED_LOGO_CHARS) {
      settings.logo = null;
      note = 'Saved, but without the logo — it’s too large to keep in the browser.';
    }
    const existing = this._saved.find((e) => e.name === name);
    const entry = { id: existing?.id ?? newId(), name, savedAt: Date.now(), settings };
    const list = [entry, ...this._saved.filter((e) => e !== existing)];
    if (!storeSaved(list)) {
      this._saveMessage = 'Couldn’t save — your browser may be blocking storage (for example in private browsing).';
      return;
    }
    this._saved = list;
    this._saveName = '';
    this._saveMessage = note;
  }

  _onLoad(e) {
    this._settings = { ...e.detail.entry.settings };
    this._logoMessage = '';
    this._saveMessage = '';
    this.renderRoot.querySelector('#url')?.focus();
  }

  _onDelete(e) {
    const { entry } = e.detail;
    if (!confirm(`Remove “${entry.name}” from saved settings?`)) return;
    const list = this._saved.filter((x) => x.id !== entry.id);
    if (storeSaved(list)) this._saved = list;
  }
}

/** Read an image file and scale it down to at most `maxPx` on its longer side, as a PNG data URL. */
async function shrinkImage(file, maxPx) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = img.naturalWidth || maxPx;
    const h = img.naturalHeight || maxPx;
    const scale = Math.min(1, maxPx / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

customElements.define('qr-app', QrApp);
