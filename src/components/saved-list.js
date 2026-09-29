import { LitElement, html, css } from 'lit';
import { sharedStyles } from './shared-styles.js';

/**
 * List of settings saved in this browser.
 * Fires `saved-load` and `saved-delete` with `detail: { entry }`.
 */
export class SavedList extends LitElement {
  static properties = {
    entries: { type: Array },
  };

  static styles = [
    sharedStyles,
    css`
      :host { display: block; }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
      li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        border: 1px solid var(--qr-border);
        border-radius: var(--qr-radius-sm);
        background: var(--qr-bg);
      }
      .dot {
        flex: none;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 8px;
        border: 5px solid;
      }
      .info { flex: 1; min-width: 0; }
      .name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .url { font-size: 0.8rem; color: var(--qr-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .buttons { display: flex; gap: 0.25rem; flex: none; }
      .buttons button { padding: 0.35rem 0.8rem; font-size: 0.875rem; }
      .empty { margin: 0; }
    `,
  ];

  constructor() {
    super();
    this.entries = [];
  }

  render() {
    if (!this.entries.length) {
      return html`<p class="empty muted small">
        Nothing saved yet. Use <strong>Save these settings</strong> to keep a code’s address and style for next time.
      </p>`;
    }
    return html`
      <ul>
        ${this.entries.map(
          (entry) => html`
            <li>
              <span
                class="dot"
                style="border-color:${entry.settings.fg};background:${entry.settings.transparent ? 'transparent' : entry.settings.bg}"
                aria-hidden="true"
              ></span>
              <div class="info">
                <div class="name">${entry.name}</div>
                <div class="url">${entry.settings.url || 'No address'} · ${formatDate(entry.savedAt)}</div>
              </div>
              <div class="buttons">
                <button @click=${() => this._emit('saved-load', entry)}>Use</button>
                <button class="link" @click=${() => this._emit('saved-delete', entry)} aria-label="Remove ${entry.name}">
                  Remove
                </button>
              </div>
            </li>
          `,
        )}
      </ul>
    `;
  }

  _emit(type, entry) {
    this.dispatchEvent(new CustomEvent(type, { detail: { entry }, bubbles: true, composed: true }));
  }
}

function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

customElements.define('saved-list', SavedList);
