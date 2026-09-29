import { css } from 'lit';

/** Base styles shared by all components (buttons, fields, cards). */
export const sharedStyles = css`
  :host {
    font-family: var(--qr-font);
    color: var(--qr-text);
  }
  *, *::before, *::after { box-sizing: border-box; }

  .card {
    background: var(--qr-surface);
    border: 1px solid var(--qr-border);
    border-radius: var(--qr-radius);
    box-shadow: var(--qr-shadow);
    padding: 1.25rem;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .step {
    display: inline-grid;
    place-items: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--qr-primary-soft);
    color: var(--qr-primary);
    font-size: 0.9rem;
    font-weight: 700;
    flex: none;
  }

  .muted { color: var(--qr-text-muted); }
  .small { font-size: 0.875rem; }

  label, .label {
    display: block;
    font-weight: 600;
    margin: 0 0 0.35rem;
  }

  input[type='text'], input[type='url'], select {
    font: inherit;
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1.5px solid var(--qr-border);
    border-radius: var(--qr-radius-sm);
    background: var(--qr-bg);
    color: var(--qr-text);
  }
  input[type='text']:focus, input[type='url']:focus, select:focus {
    outline: none;
    border-color: var(--qr-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--qr-focus) 35%, transparent);
  }

  button {
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    border-radius: 999px;
    border: 1.5px solid var(--qr-border);
    background: var(--qr-surface);
    color: var(--qr-text);
    padding: 0.55rem 1.1rem;
    transition: background 0.15s, border-color 0.15s, transform 0.05s;
  }
  button:hover { background: var(--qr-surface-2); }
  button:active { transform: translateY(1px); }
  button:focus-visible, [role='radio']:focus-visible {
    outline: 3px solid var(--qr-focus);
    outline-offset: 2px;
  }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button.primary {
    background: var(--qr-primary);
    border-color: var(--qr-primary);
    color: var(--qr-on-primary);
  }
  button.primary:hover:not(:disabled) {
    background: var(--qr-primary-hover);
    border-color: var(--qr-primary-hover);
  }
  button.link {
    border: none;
    background: none;
    padding: 0.25rem 0.4rem;
    color: var(--qr-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* Segmented choice buttons (radio-like). */
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .choices button[aria-pressed='true'] {
    background: var(--qr-primary-soft);
    border-color: var(--qr-primary);
    color: var(--qr-text);
  }

  .note {
    border-radius: var(--qr-radius-sm);
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
    margin: 0.6rem 0 0;
  }
  .note.warn { background: var(--qr-warn-bg); color: var(--qr-warn-text); }
  .note.error { background: var(--qr-error-bg); color: var(--qr-error-text); }

  .visually-hidden {
    position: absolute !important;
    width: 1px; height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;
