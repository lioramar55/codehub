import { Injectable, Signal, computed, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'codehub.theme';

  private readonly themeInternal = signal<ThemeMode>(this.loadInitial());
  readonly theme: Signal<ThemeMode> = this.themeInternal.asReadonly();
  readonly isDark = computed<boolean>(() => this.themeInternal() === 'dark');

  constructor() {
    this.applyThemeClass(this.themeInternal());
  }

  toggle(): void {
    const next: ThemeMode = this.themeInternal() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(mode: ThemeMode): void {
    this.themeInternal.set(mode);
    this.persist(mode);
    this.applyThemeClass(mode);
  }

  private loadInitial(): ThemeMode {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === 'light' || raw === 'dark') return raw;
    } catch {
      console.error('error loading theme color');
    }
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }

  private persist(mode: ThemeMode) {
    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      console.error('error saving theme color');
    }
  }

  private applyThemeClass(mode: ThemeMode) {
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }
}
