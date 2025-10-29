import React, { useCallback, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { AuthModal, useAuth } from './components/AuthModal';
import RecentImages from './components/RecentImages';

const MAX_PREVIEW = 500;

function Header({ user, onSignIn, onSignOut }) {
  return (
    <header className="app-header w-full sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center font-bold text-lg shadow-xl">
            AZ
          </div>
          <div>
            <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Image Resizer Pro
            </h1>
            <p className="text-xs text-gray-500 -mt-1">Made by Akhil & Zaki</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/60 rounded-xl glass">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {user.signInDetails?.loginId || user.attributes?.email || user.username}
                </span>
              </div>
              <button 
                onClick={onSignOut} 
                className="px-4 py-2 rounded-xl cta-btn font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <button 
              onClick={onSignIn} 
              className="px-4 py-2 rounded-xl cta-btn font-medium"
            >
              Try it free
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Controls({ options, setOptions, canProcess, onProcess, onReset, onSaveS3 }) {
  const set = (patch) => setOptions(prev => ({ ...prev, ...patch }));

  return (
    <div className="w-full card rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">⚙️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Resize Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Width (px)</label>
            <input 
              type="number" 
              min="1" 
              value={options.width || ''}
              onChange={e => set({ width: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="Enter width"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Height (px)</label>
            <input 
              type="number" 
              min="1" 
              value={options.height || ''}
              onChange={e => set({ height: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="Enter height"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Output Format</label>
            <select 
              value={options.format} 
              onChange={e => set({ format: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="image/jpeg">JPG (JPEG)</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quality: {options.quality}%
            </label>
            <input 
              type="range" 
              min="50" 
              max="100" 
              value={options.quality}
              onChange={e => set({ quality: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
        <input 
          id="lock" 
          type="checkbox" 
          checked={options.lockAspect}
          onChange={e => set({ lockAspect: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="lock" className="text-sm font-medium text-gray-700 cursor-pointer">
          🔒 Lock aspect ratio
        </label>
      </div>

        <div className="flex flex-wrap gap-3">
        <button 
          disabled={!canProcess} 
          onClick={onProcess}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 cta-btn ${
            canProcess ? '' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          🚀 Resize All Images
        </button>
        <button 
          onClick={onReset} 
          className="px-6 py-3 rounded-xl secondary-btn font-semibold"
        >
          🔄 Reset
        </button>
        <button 
          onClick={onSaveS3} 
          className="px-6 py-3 rounded-xl cta-btn font-semibold"
        >
          ☁️ Save to Cloud
        </button>
      </div>
    </div>
  );
}

function FileCard({ file, idx, onRemove }) {
  return (
    <div className="group file-card rounded-3xl border border-gray-200 bg-white overflow-hidden">
      <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-blue-50 grid place-items-center overflow-hidden">
        <img 
          alt={file.name} 
          src={file.preview} 
          className="max-w-full max-h-full object-contain transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => onRemove(idx)} 
            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{file.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(file.size / 1024)} KB
            </div>
          </div>
        </div>
        <button 
          onClick={() => onRemove(idx)} 
          className="w-full px-4 py-2 secondary-btn text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-200 font-medium text-sm"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );
}

async function resizeImage(file, targetW, targetH, lockAspect, type, quality) {
  const imgBitmap = await createImageBitmap(file);
  let w = targetW || imgBitmap.width;
  let h = targetH || imgBitmap.height;

  if (lockAspect) {
    const aspect = imgBitmap.width / imgBitmap.height;
    if (targetW && !targetH) {
      h = Math.round(targetW / aspect);
    } else if (!targetW && targetH) {
      w = Math.round(targetH * aspect);
    }
  }

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type, quality: quality / 100 });
  return blob;
}


export default function App() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [options, setOptions] = useState({
    width: 0,
    height: 0,
    lockAspect: true,
    format: 'image/jpeg',
    quality: 90,
  });
  const inputRef = useRef(null);
  const { user, showAuthModal, setShowAuthModal, handleSignOut, handleAuthSuccess } = useAuth();

  const handleFiles = useCallback((fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    const withPreview = arr.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setFiles(prev => [...prev, ...withPreview]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };
  const onBrowse = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const canProcess = useMemo(() => files.length > 0 && !processing, [files.length, processing]);

  const removeAt = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const resetAll = () => {
    setFiles([]);
    setOptions(o => ({ ...o, width: 0, height: 0, quality: 90, format: 'image/jpeg', lockAspect: true }));
    if (inputRef.current) inputRef.current.value = '';
  };

  const processAll = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const zip = new JSZip();
      for (const f of files) {
        const blob = await resizeImage(f, options.width, options.height, options.lockAspect, options.format, options.quality);
        // name extension
        const ext = options.format === 'image/png' ? 'png' : options.format === 'image/webp' ? 'webp' : 'jpg';
        const name = f.name.replace(/\.[^.]+$/, '') + `_resized.${ext}`;
        zip.file(name, blob);
      }
      const zipped = await zip.generateAsync({ type: 'blob' });
      saveAs(zipped, 'resized_images.zip');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to resize');
    } finally {
      setProcessing(false);
    }
  };

  const saveAllToS3 = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const blob = await resizeImage(f, options.width, options.height, options.lockAspect, options.format, options.quality);
        const ext = options.format === 'image/png' ? 'png' : options.format === 'image/webp' ? 'webp' : 'jpg';
        // Use a per-user prefix when possible so files are scoped correctly.
        const userPrefixRaw = user?.username || user?.attributes?.email || '';
        const userPrefix = userPrefixRaw ? String(userPrefixRaw).replace(/[^a-zA-Z0-9-_\.]/g, '_') : '';
        const prefix = userPrefix ? `resized/${userPrefix}/` : `resized/`;
        const key = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        // Include level: 'private' so uploads are stored in the authenticated user's private area.
        await uploadData({ key, data: blob, options: { contentType: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg', level: 'private' } }).result;
  const url = await getUrl({ key, options: { expiresIn: 3600, level: 'private' } });
  // normalize url (getUrl may return a string or an object with `.url`)
  const finalUrl = typeof url === 'string' ? url : (url?.url ? String(url.url) : '');
  uploaded.push({ key, url: finalUrl });
      }
      alert(`Uploaded ${uploaded.length} file(s) to S3. Temporary URLs copied to console.`);
      console.log('Uploaded files:', uploaded);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to upload to S3');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignIn={() => setShowAuthModal(true)} onSignOut={handleSignOut} />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />

      <main className="flex-1">
        <section className="hero-section">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="hero-card mx-auto relative overflow-visible">
              <div className="hero-blob" aria-hidden></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white/60 to-white/40 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Professional Image Resizing Tool
              </div>
              <h2 className="hero-title bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 mb-4">
                Resize Images Like a Pro
              </h2>
              <p className="hero-sub mb-6">
                Batch resize, preserve aspect ratio, and export in multiple formats — with cloud storage and professional quality results.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">Batch Processing</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">Aspect Ratio Lock</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">Multiple Formats</span>
                </div>
              </div>

              {!user && (
                <div className="max-w-md mx-auto p-6 bg-gradient-to-r from-white/60 to-white/30 rounded-2xl border border-blue-100 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Unlock Premium Features</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Save your resized images to the cloud and access them from anywhere with our secure storage.
                  </p>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="w-full px-6 py-3 rounded-xl cta-btn font-medium"
                  >
                    Get Started Free
                  </button>
                </div>
              )}
              {/* hero feature highlights */}
              <div className="mt-8 feature-grid">
                <div className="feature-card flex items-start gap-3">
                  <div className="feature-icon bg-gradient-to-br from-blue-600 to-purple-600">⚡</div>
                  <div>
                    <div className="text-sm font-semibold">Blazing fast</div>
                    <div className="text-xs text-gray-500">High-performance batch resizing</div>
                  </div>
                </div>
                <div className="feature-card flex items-start gap-3">
                  <div className="feature-icon bg-gradient-to-br from-green-400 to-teal-400">🔒</div>
                  <div>
                    <div className="text-sm font-semibold">Private by default</div>
                    <div className="text-xs text-gray-500">Cloud saves scoped to your account</div>
                  </div>
                </div>
                <div className="feature-card flex items-start gap-3">
                  <div className="feature-icon bg-gradient-to-br from-purple-500 to-indigo-500">🎯</div>
                  <div>
                    <div className="text-sm font-semibold">Precision controls</div>
                    <div className="text-xs text-gray-500">Fine-grain width/height and quality settings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 p-12 grid place-items-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">📁</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Your Images</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Drag and drop your images here or click the button below to browse your files
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => inputRef.current?.click()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                >
                  <span>📂</span>
                  Choose Images
                </button>
                <div className="text-sm text-gray-500">
                  Supports JPG, PNG, WEBP, GIF
                </div>
              </div>
              <input ref={inputRef} type="file" accept="image/*" multiple onChange={onBrowse} className="hidden" />
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((f, i) => (
                    <FileCard key={i} file={f} idx={i} onRemove={removeAt} />
                  ))}
                </div>
              </div>
              <div className="md:col-span-1">
                <Controls
                  options={options}
                  setOptions={setOptions}
                  canProcess={canProcess}
                  onProcess={processAll}
                  onReset={resetAll}
                  onSaveS3={saveAllToS3}
                />
                {processing && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-700 font-medium">Processing your images...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Recent images (bottom of page) */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <RecentImages user={user} max={5} />
        </div>
      )}

      <footer className="app-footer border-t">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AZ</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Image Resizer Pro</div>
                <div className="text-xs text-gray-500">Made with ❤️ by Akhil & Zaki</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>React + Vite</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>AWS Amplify</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
