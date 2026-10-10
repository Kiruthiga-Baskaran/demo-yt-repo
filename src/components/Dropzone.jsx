import { useCallback, useRef, useState } from "react";

export default function Dropzone({ onFile }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const handleClick = useCallback(() => inputRef.current?.click(), []);
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    []
  );

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleChange(e) {
    onFile(e.target.files?.[0]);
    // Allow selecting the same file twice in a row.
    e.target.value = "";
  }

  return (
    <div
      className={`dropzone${dragover ? " dragover" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Upload resume PDF"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handleChange}
      />
      <div className="dropzone-icon">📄</div>
      <p className="dropzone-title">Drag &amp; drop your resume here</p>
      <p className="dropzone-sub">
        or <span className="link">browse files</span> · PDF only
      </p>
    </div>
  );
}
