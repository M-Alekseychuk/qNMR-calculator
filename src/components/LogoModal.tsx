import React, { useState, useRef } from 'react';
import { Upload, X, RotateCcw, Check, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';
import { DEFAULT_LOGO_BASE64 } from '../lib/logoBase64';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string;
  logoScale: number;
  onSaveLogo: (logoDataUrl: string) => void;
  onChangeLogoScale: (scale: number) => void;
  onResetDefault: () => void;
}

export default function LogoModal({
  isOpen,
  onClose,
  currentLogo,
  logoScale,
  onSaveLogo,
  onChangeLogoScale,
  onResetDefault,
}: LogoModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDefault = currentLogo === DEFAULT_LOGO_BASE64;

  const processImageFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Optimize image via canvas if it's a raster image (PNG/JPEG/WebP) to avoid localStorage quota issues
      if (file.type.includes('svg')) {
        onSaveLogo(result);
        setSuccessMsg('Logo updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onSaveLogo(result);
          setSuccessMsg('Logo updated successfully!');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use PNG to preserve transparency
        const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
        onSaveLogo(optimizedDataUrl);
        setSuccessMsg('Logo updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      };

      img.onerror = () => {
        setErrorMsg('Could not process this image format. Please try a standard PNG or JPEG.');
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleReset = () => {
    onResetDefault();
    onChangeLogoScale(100);
    setErrorMsg(null);
    setSuccessMsg('Reset to default OPCP logo & standard size.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Customize Organization Logo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shown in software header and on generated analytical reports
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status feedback */}
          {errorMsg && (
            <div className="p-3 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Logo Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Current Display Logo
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isDefault 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}>
                {isDefault ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Default OPCP Logo
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    Custom Logo Active
                  </>
                )}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center min-h-[120px]">
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs max-w-full flex items-center justify-center transition-all">
                <img 
                  src={currentLogo} 
                  alt="Active Logo" 
                  style={{ height: `${Math.round(40 * (logoScale / 100))}px` }}
                  className="max-h-24 max-w-full object-contain transition-all" 
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                Live scaling preview: {logoScale}% {logoScale === 100 ? '(Standard)' : ''}
              </span>
            </div>
          </div>

          {/* Logo Size Control Section */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Logo Size
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  logoScale === 100 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}>
                  {logoScale === 100 ? 'Standard (100%)' : `${logoScale}%`}
                </span>
                {logoScale !== 100 && (
                  <button
                    type="button"
                    onClick={() => onChangeLogoScale(100)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    title="Reset to 100% standard size"
                  >
                    Reset to Standard
                  </button>
                )}
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">60%</span>
              <input
                id="logo-size-range-slider"
                type="range"
                min="60"
                max="160"
                step="5"
                value={logoScale}
                onChange={(e) => onChangeLogoScale(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-slate-400 font-medium">160%</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: 'Compact (75%)', val: 75 },
                { label: 'Standard (100%)', val: 100 },
                { label: 'Medium (120%)', val: 120 },
                { label: 'Large (140%)', val: 140 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onChangeLogoScale(preset.val)}
                  className={`text-[11px] py-1.5 px-1 rounded-lg font-medium transition-colors border cursor-pointer text-center ${
                    logoScale === preset.val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The 100% standard size corresponds to the default design proportions.
            </p>
          </div>

          {/* Dropzone / Upload area */}
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Upload New Logo
            </span>

            <input 
              ref={fileInputRef}
              type="file" 
              id="custom-logo-file-input"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden" 
              onChange={handleFileChange}
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50/70 dark:hover:bg-slate-750'
              }`}
            >
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Click to browse or drag & drop an image
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPEG, SVG or WebP with transparent background recommended
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 sticky bottom-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isDefault && logoScale === 100}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              isDefault && logoScale === 100
                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400' 
                : 'border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Revert back to standard OPCP logo and 100% standard size"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
