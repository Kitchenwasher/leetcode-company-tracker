import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AccentPreset {
  id: string;
  name: string;
  color: string;
  hoverColor: string;
  description: string;
}

export const PRESET_ACCENTS: AccentPreset[] = [
  {
    id: 'white',
    name: 'Stellar White',
    color: '#FFFFFF',
    hoverColor: '#E5E7EB',
    description: 'Minimalist clean celestial white with crisp contrast',
  },
  {
    id: 'yellow',
    name: 'Cyber Yellow',
    color: '#E5FF00',
    hoverColor: '#D4ED00',
    description: 'Original electric cyber yellow with high contrast',
  },
  {
    id: 'purple',
    name: 'Cosmic Purple',
    color: '#A855F7',
    hoverColor: '#9333EA',
    description: 'Signature cosmic purple matching the platform theme',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    color: '#38BDF8',
    hoverColor: '#0284C7',
    description: 'Futuristic cyan & telemetry electric blue',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    color: '#10B981',
    hoverColor: '#059669',
    description: 'Algorithmic matrix & terminal green',
  },
  {
    id: 'rose',
    name: 'Sunset Rose',
    color: '#F43F5E',
    hoverColor: '#E11D48',
    description: 'Vibrant cyberpunk neon coral & rose',
  },
];

export interface ThemeAccentContextType {
  activePresetId: string;
  accentColor: string;
  hoverColor: string;
  contrastTextColor: string;
  isCustom: boolean;
  presets: AccentPreset[];
  setPreset: (presetId: string) => void;
  setCustomHex: (hex: string) => boolean;
  resetDefault: () => void;
}

const STORAGE_KEY = 'cheatcode_theme_accent';

// Helper: parse hex into RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  } else if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  return null;
}

// Helper: compute perceived brightness to determine black vs white text contrast
function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  // Perceived luminance formula (ITU-R BT.709)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return luminance > 140 ? '#000000' : '#FFFFFF';
}

// Helper: compute a slightly adjusted hover color
function computeHoverColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = 0.88; // slightly darker
  const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper: write CSS variables to :root
function applyDomTheme(color: string, hover: string, presetId: string) {
  const root = document.documentElement;
  const rgb = hexToRgb(color) || { r: 229, g: 255, b: 0 };
  const contrast = getContrastColor(color);

  root.style.setProperty('--theme-accent', color);
  root.style.setProperty('--theme-accent-hover', hover);
  root.style.setProperty('--theme-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--theme-accent-bg-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`);
  root.style.setProperty('--theme-accent-bg-medium', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
  root.style.setProperty('--theme-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
  root.style.setProperty('--theme-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`);
  root.style.setProperty('--theme-contrast-text', contrast);
  root.setAttribute('data-accent-theme', presetId);
}

const ThemeAccentContext = createContext<ThemeAccentContextType | undefined>(undefined);

export const ThemeAccentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePresetId, setActivePresetId] = useState<string>('purple');
  const [accentColor, setAccentColor] = useState<string>('#A855F7');
  const [hoverColor, setHoverColor] = useState<string>('#9333EA');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Hardcode purple theme on mount
  useEffect(() => {
    applyDomTheme('#A855F7', '#9333EA', 'purple');
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          presetId: 'purple',
          color: '#A855F7',
          hoverColor: '#9333EA',
          isCustom: false,
        })
      );
    } catch {
      // ignore
    }
  }, []);

  const setPreset = (presetId: string) => {
    const preset = PRESET_ACCENTS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setAccentColor(preset.color);
    setHoverColor(preset.hoverColor);
    setIsCustom(false);

    applyDomTheme(preset.color, preset.hoverColor, preset.id);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          presetId: preset.id,
          color: preset.color,
          hoverColor: preset.hoverColor,
          isCustom: false,
        })
      );
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
  };

  const setCustomHex = (hex: string): boolean => {
    const formatted = hex.startsWith('#') ? hex.trim() : `#${hex.trim()}`;
    const rgb = hexToRgb(formatted);
    if (!rgb) return false;

    const hover = computeHoverColor(formatted);
    setActivePresetId('custom');
    setAccentColor(formatted);
    setHoverColor(hover);
    setIsCustom(true);

    applyDomTheme(formatted, hover, 'custom');

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          presetId: 'custom',
          color: formatted,
          hoverColor: hover,
          isCustom: true,
        })
      );
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
    return true;
  };

  const resetDefault = () => {
    setPreset('purple');
  };

  const contrastTextColor = getContrastColor(accentColor);

  return (
    <ThemeAccentContext.Provider
      value={{
        activePresetId,
        accentColor,
        hoverColor,
        contrastTextColor,
        isCustom,
        presets: PRESET_ACCENTS,
        setPreset,
        setCustomHex,
        resetDefault,
      }}
    >
      {children}
    </ThemeAccentContext.Provider>
  );
};

export const useThemeAccent = (): ThemeAccentContextType => {
  const context = useContext(ThemeAccentContext);
  if (!context) {
    throw new Error('useThemeAccent must be used within a ThemeAccentProvider');
  }
  return context;
};
