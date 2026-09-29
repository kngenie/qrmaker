import { LitElement, html, css } from 'lit';
import { sharedStyles } from './shared-styles.js';

/**
 * Color swatches plus a "custom" color well.
 * With `allow-transparent`, adds a see-through option.
 * Fires `color-change` with `detail: { color, transparent }`.
 */
export class ColorPicker extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    swatches: { type: Array },
    allowTransparent: { type: Boolean, attribute: 'allow-transparent' },
    transparent: { type: Boolean },
  };

  static styles = [
    sharedStyles,
    css`
      .row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
      .swatch {
        width: 2.4rem;
        height: 2.4rem;
        padding: 0;
        border-radius: 50%;
        border: 2px solid var(--qr-border);
        position: relative;
      }
      .swatch[aria-pressed='true'] {
        border-color: var(--qr-surface);
        box-shadow: 0 0 0 3px var(--qr-primary);
      }
      .transparent {
        background-color: #fff;
        background-image:
          linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),
          linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);
        background-size: 12px 12px;
        background-position: 0 0, 6px 6px;
      }
      .custom {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        margin: 0;
        padding: 0.25rem 0.75rem 0.25rem 0.25rem;
        border: 1.5px solid var(--qr-border);
        border-radius: 999px;
      }
      .custom.active { border-color: var(--qr-primary); background: var(--qr-primary-soft); }
      .custom:focus-within { outline: 3px solid var(--qr-focus); outline-offset: 2px; }
      input[type='color'] {
        width: 1.9rem;
        height: 1.9rem;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: none;
        cursor: pointer;
      }
      input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
      input[type='color']::-webkit-color-swatch { border: 1px solid var(--qr-border); border-radius: 50%; }
      input[type='color']::-moz-color-swatch { border: 1px solid var(--qr-border); border-radius: 50%; }
    `,
  ];

  constructor() {
    super();
    this.label = '';
    this.value = '#000000';
    this.swatches = [];
    this.allowTransparent = false;
    this.transparent = false;
  }

  render() {
    const isPreset = !this.transparent && this.swatches.some((s) => s.color === this.value);
    return html`
      <div class="label" id="lbl">${this.label}</div>
      <div class="row" role="group" aria-labelledby="lbl">
        ${this.swatches.map(
          (s) => html`
            <button
              class="swatch"
              style="background:${s.color}"
              title=${s.name}
              aria-label=${s.name}
              aria-pressed=${!this.transparent && s.color === this.value}
              @click=${() => this._emit(s.color, false)}
            ></button>
          `,
        )}
        ${this.allowTransparent
          ? html`<button
              class="swatch transparent"
              title="See-through"
              aria-label="See-through (no background)"
              aria-pressed=${this.transparent}
              @click=${() => this._emit(this.value, true)}
            ></button>`
          : ''}
        <label class="custom ${!isPreset && !this.transparent ? 'active' : ''}">
          <input
            type="color"
            .value=${this.value}
            @input=${(e) => this._emit(e.target.value, false)}
          />
          Custom
        </label>
      </div>
    `;
  }

  _emit(color, transparent) {
    this.dispatchEvent(
      new CustomEvent('color-change', { detail: { color, transparent }, bubbles: true, composed: true }),
    );
  }
}

customElements.define('color-picker', ColorPicker);
