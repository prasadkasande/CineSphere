import { useRef, useState } from 'react';
import './ImageUpload.css';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

function readableSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Themed replacement for `<input type="file">`, whose native "Choose file"
 * button is browser chrome and can't be styled - it rendered as a grey system
 * control in the middle of the dark theme.
 *
 * Adds what the native control never gave us: drag and drop, a live preview,
 * the file's name and size, a way to clear the selection, and type/size
 * validation up front rather than after a failed upload.
 */
export default function ImageUpload({
  value,
  previewUrl,
  onChange,
  label = 'Cover image',
  hint,
  required = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState('');

  function accept(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setProblem('Use a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setProblem(`That image is ${readableSize(file.size)} — the limit is 5 MB.`);
      return;
    }
    setProblem('');
    onChange(file);
  }

  function clear(e) {
    e.stopPropagation();
    setProblem('');
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0]);
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="field">
      <label htmlFor="image-upload-input">
        {label}
        {!required && <span className="upload-optional"> · optional</span>}
      </label>

      <div
        className={`upload-zone ${dragging ? 'is-dragging' : ''} ${previewUrl ? 'has-image' : ''}`}
        onClick={openPicker}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openPicker())}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        aria-label={`${label}. Click or drop an image to upload.`}
      >
        {previewUrl ? (
          <>
            <div className="upload-preview" style={{ backgroundImage: `url(${previewUrl})` }} />
            <div className="upload-meta">
              <strong>{value ? value.name : 'Current image'}</strong>
              <span className="dim">
                {value ? readableSize(value.size) : 'Tap to replace'}
              </span>
              <div className="upload-meta-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={openPicker}>
                  Replace
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="upload-empty">
            <span className="upload-icon" aria-hidden="true">
              🖼
            </span>
            <strong>Drop an image here, or click to browse</strong>
            <span className="dim">JPG, PNG or WebP · up to 5 MB</span>
          </div>
        )}
      </div>

      {hint && !problem && <span className="upload-hint">{hint}</span>}
      {problem && <span className="upload-problem">{problem}</span>}

      <input
        id="image-upload-input"
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="upload-native"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </div>
  );
}
