import { App, MarkdownRenderer, TFile } from 'obsidian';
import { CounterData } from './types';

/**
 * Renderiza markdown a HTML dentro de `el`, usando la API disponible según la
 * versión de Obsidian instalada.
 */
export async function renderMarkdownInto(
  app: App,
  el: HTMLElement,
  markdown: string,
  sourcePath: string,
  component: unknown
): Promise<void> {
  el.empty();
  const renderer = MarkdownRenderer as unknown as {
    render?: (app: App, markdown: string, el: HTMLElement, sourcePath: string, component: unknown) => Promise<void>;
    renderMarkdown?: (markdown: string, el: HTMLElement, sourcePath: string, component: unknown) => Promise<void>;
  };
  if (typeof renderer.render === 'function') {
    await renderer.render(app, markdown, el, sourcePath, component);
  } else if (typeof renderer.renderMarkdown === 'function') {
    await renderer.renderMarkdown(markdown, el, sourcePath, component);
  }
}

export function genId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function readFrontmatterStat(app: App, path: string, keys: string[]): number | null {
  const file = app.vault.getAbstractFileByPath(path);
  if (!file) return null;
  const cache = app.metadataCache.getFileCache(file as TFile);
  const fm = cache?.frontmatter as Record<string, unknown> | undefined;
  if (!fm) return null;
  for (const k of keys) {
    const val = fm[k];
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
  }
  return null;
}

/**
 * Busca en el YAML de una nota una propiedad de imagen (image/imagen/img/...) y
 * la resuelve a una ruta real dentro de la bóveda.
 */
export function readFrontmatterImagePath(app: App, notePath: string, keys: string[]): string | null {
  const file = app.vault.getAbstractFileByPath(notePath);
  if (!file) return null;
  const cache = app.metadataCache.getFileCache(file as TFile);
  const fm = cache?.frontmatter as Record<string, unknown> | undefined;
  if (!fm) return null;
  for (const k of keys) {
    const rawVal = fm[k];
    if (rawVal === undefined || rawVal === null) continue;
    const val = Array.isArray(rawVal) ? String(rawVal[0]) : String(rawVal);
    const trimmed = val.trim();
    if (!trimmed) continue;
    let clean = trimmed.replace(/^!?\[\[/, '').replace(/\]\]$/, '');
    clean = clean.split('|')[0]?.trim() ?? '';
    if (!clean) continue;
    const dest = app.metadataCache.getFirstLinkpathDest(clean, notePath);
    if (dest) return dest.path;
    const direct = app.vault.getAbstractFileByPath(clean);
    if (direct) return direct.path;
  }
  return null;
}

export function readFrontmatterWeight(app: App, notePath: string, keys: string[]): number | null {
  const file = app.vault.getAbstractFileByPath(notePath);
  if (!file) return null;
  const cache = app.metadataCache.getFileCache(file as TFile);
  const fm = cache?.frontmatter as Record<string, unknown> | undefined;
  if (!fm) return null;
  for (const k of keys) {
    const val = fm[k];
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
  }
  return null;
}

export function newCounter(): CounterData {
  return { id: genId(), label: 'Contador', value: 0, max: null };
}

export function getIconClass(icon: string | null | undefined, prefix = 'ra'): string {
  if (!icon) return '';
  const clean = icon.trim();
  if (clean.includes(' ')) return clean;
  if (clean.startsWith(prefix + '-')) return `${prefix} ${clean}`;
  return `${prefix} ${prefix}-${clean}`;
}

/*
  * funcion para determinar si un color tine una luminancia alta o baja, para poder
  * determinar si el color del texto debe ser blanco o negro.
  * la funcion sera true si el color tiene una luminancia alta.
  * la funcion sera false si el color tiene una luminancia baja.
*/
export function isLightColor(color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  const normalizedColor = ctx.fillStyle;

  let r, g, b;

  if (normalizedColor.startsWith('#')) {
    let hex = normalizedColor.slice(1);

    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const match = normalizedColor.match(/[\d.]+/g);

    if (!match || match.length < 3) return false;

    if (normalizedColor.startsWith('rgb')) {
      [r, g, b] = match.map(Number);
    } else {
      return false;
    }
  }

  // Calcular luminosidad perceptual
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6;
}