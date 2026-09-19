import React, { useState } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useThemeAccent, PRESET_ACCENTS } from '../context/ThemeAccentContext';
import { sounds } from '../utils/sound';

export const ThemeToolkitCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    activePresetId,
    accentColor,
    hoverColor,
    contrastTextColor,
    isCustom,
    setPreset,
    setCustomHex,
    resetDefault,
  } = useThemeAccent();

  const [customInput, setCustomInput] = useState(isCustom ? accentColor : '#');
  const [inputError, setInputError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApplyCustom = (hexToApply?: string) => {
    const target = hexToApply || customInput;
    const cleaned = target.trim();
    if (!cleaned || cleaned === '#') {
      setInputError('Please enter a valid hex color code.');
      return;
    }
    const success = setCustomHex(cleaned);
    if (success) {
      sounds.playSuccess();
      setInputError(null);
      setSuccessMsg(`Applied custom color ${cleaned.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setInputError('Invalid hex color format (e.g. #38BDF8 or #E5FF00).');
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCustomInput(val);
    handleApplyCustom(val);
  };

  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-[#0E1217] p-6 shadow-xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-accent">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight font-sans flex items-center gap-2">
              <span>Theme Accent Toolkit</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-accent border border-accent/20">
                LIVE DYNAMIC
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Switch themes between Stellar White, Cyber Yellow, Cosmic Purple, Electric Blue, or your own custom Hex code.
            </p>
          </div>
        </div>

        {/* Reset Default */}
        <button
          onClick={() => {
            sounds.playClick();
            resetDefault();
            setCustomInput('#FFFFFF');
            setSuccessMsg('Reset to default Stellar White');
            setTimeout(() => setSuccessMsg(null), 3000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          title="Reset to default Stellar White"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-accent-subtle border border-accent/30 text-accent text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Preset Theme Selection Grid */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          Curated Space Presets
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_ACCENTS.map((preset) => {
            const isSelected = !isCustom && activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  sounds.playClick();
                  setPreset(preset.id);
                  setCustomInput(preset.color);
                  setInputError(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-md shadow-accent/10'
                    : 'border-white/[0.08] bg-[#12161E] hover:border-white/[0.18] hover:bg-[#161C26]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-xs font-bold text-white font-sans">
                      {preset.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-black">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 font-sans mt-2 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{preset.color}</span>
                  <span className="group-hover:text-white transition-colors">&rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Hex Code Studio */}
      <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Custom Hex Code Input
            </span>
          </div>
          {isCustom && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 font-semibold">
              ACTIVE CUSTOM
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Type any 6-digit hex color code (e.g. <span className="font-mono text-zinc-300">#00E5FF</span>, <span className="font-mono text-zinc-300">#FF3366</span>) or choose directly with the native color picker. The entire interface updates immediately.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Native Color Picker Swatch */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/20 shrink-0 cursor-pointer group shadow-sm">
            <input
              type="color"
              value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#FFFFFF'}
              onChange={handleColorPickerChange}
              className="absolute -top-3 -left-3 w-18 h-18 cursor-pointer border-none bg-transparent"
              title="Click to pick custom color"
            />
            <div
              className="w-full h-full pointer-events-none flex items-center justify-center text-xs"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value.toUpperCase());
                setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustom();
                }
              }}
              placeholder="#FFFFFF"
              maxLength={7}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-white/[0.12] focus:border-accent text-xs font-mono text-white outline-none transition-colors uppercase tracking-wider"
            />
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={() => handleApplyCustom()}
            className="px-5 py-2.5 rounded-xl bg-accent hover:opacity-90 font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0 font-sans"
            style={{ color: contrastTextColor }}
          >
            Apply Color
          </button>
        </div>

        {inputError && (
          <p className="text-xs text-rose-400 font-sans mt-1">{inputError}</p>
        )}
      </div>

      {/* Live Interactive Component Preview */}
      <div className="p-4 rounded-xl bg-[#090C10] border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          <Eye className="w-3.5 h-3.5 text-accent" />
          <span>Real-time Interface Preview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Preview: Primary Action Button */}
          <div className="p-3 rounded-lg bg-[#12161E] border border-white/[0.06] space-y-2">
            <span className="text-[10px] text-zinc-500 font-mono">PRIMARY BUTTON</span>
            <button
              className="w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              style={{ backgroundColor: accentColor, color: contrastTextColor }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Mock Interview</span>
            </button>
          </div>

          {/* Preview: Active Nav Pill */}
          <div className="p-3 rounded-lg bg-[#12161E] border border-white/[0.06] space-y-2">
            <span className="text-[10px] text-zinc-500 font-mono">ACTIVE NAV PILL</span>
            <div
              className="py-2 px-3 rounded-lg font-semibold text-xs border-l-2 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--theme-accent-bg-subtle)',
                color: accentColor,
                borderLeftColor: accentColor,
              }}
            >
              <span>Dashboard Active</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            </div>
          </div>

          {/* Preview: Status Pill & Glow */}
          <div className="p-3 rounded-lg bg-[#12161E] border border-white/[0.06] space-y-2">
            <span className="text-[10px] text-zinc-500 font-mono">STATUS BADGE &amp; GLOW</span>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border"
                style={{
                  backgroundColor: 'var(--theme-accent-bg-subtle)',
                  borderColor: 'var(--theme-accent-border)',
                  color: accentColor,
                }}
              >
                3,399 Qs Verified
              </span>
              <span
                className="w-3 h-3 rounded-full animate-pulse shadow-md"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 10px ${accentColor}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuickThemePopover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}> = ({ isOpen, onClose, onNavigateToSettings }) => {
  const {
    activePresetId,
    accentColor,
    isCustom,
    setPreset,
    setCustomHex,
    contrastTextColor,
  } = useThemeAccent();

  const [hexVal, setHexVal] = useState(isCustom ? accentColor : '#');

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 mt-2 w-72 bg-[#11141A] border border-white/[0.12] rounded-xl shadow-2xl p-3.5 z-50 animate-fadeIn font-sans text-xs space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-accent" />
          <span className="font-bold text-white text-xs">Accent Color Toolkit</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase">
          {isCustom ? 'Custom' : activePresetId}
        </span>
      </div>

      {/* Preset Swatches */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
          Quick Swatches
        </span>
        <div className="flex items-center justify-between gap-1.5">
          {PRESET_ACCENTS.map((p) => {
            const isSelected = !isCustom && activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  sounds.playClick();
                  setPreset(p.id);
                  setHexVal(p.color);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-white scale-110 shadow-md ring-2 ring-white/20'
                    : 'border-white/10 hover:border-white/40 hover:scale-105'
                }`}
                style={{ backgroundColor: p.color }}
                title={`${p.name} (${p.color})`}
              >
                {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Hex Quick Bar */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
          Custom Hex
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#FFFFFF'}
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              setHexVal(v);
              setCustomHex(v);
            }}
            className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 cursor-pointer bg-transparent shrink-0"
            title="Choose Color"
          />
          <input
            type="text"
            value={hexVal}
            onChange={(e) => setHexVal(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setCustomHex(hexVal);
              }
            }}
            placeholder="#38BDF8"
            maxLength={7}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-white/[0.1] text-[11px] font-mono text-white outline-none focus:border-accent"
          />
          <button
            onClick={() => {
              sounds.playClick();
              setCustomHex(hexVal);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-accent font-semibold text-[11px] hover:opacity-90 transition-all cursor-pointer shrink-0"
            style={{ color: contrastTextColor }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Link to Full Studio */}
      <div className="pt-2 border-t border-white/[0.08]">
        <button
          onClick={() => {
            onClose();
            onNavigateToSettings();
          }}
          className="w-full flex items-center justify-between text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer py-1"
        >
          <span>Full Customization Studio</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
