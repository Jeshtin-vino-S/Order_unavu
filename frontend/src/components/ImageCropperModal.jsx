import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon } from './Icons';

// Single standard Hero Card ratio (16:10) for 100% full container fit
const HERO_CARD_CONFIG = {
  name: 'Hero Card',
  ratio: 16 / 10, // 1.6
  exportW: 1280,
  exportH: 800
};

export const ImageCropperModal = ({
  imageSrc,
  fileName = 'hero-image.jpg',
  onCropComplete,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [loadingSrc, setLoadingSrc] = useState(true);

  const dragStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const viewportRef = useRef(null);

  // Safely resolve imageSrc (converts remote URLs to local blob URLs to prevent canvas CORS taint)
  useEffect(() => {
    let active = true;
    let createdBlobUrl = null;

    if (!imageSrc) {
      setResolvedSrc('');
      setLoadingSrc(false);
      return;
    }

    setLoadingSrc(true);

    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          if (!active) return;
          createdBlobUrl = URL.createObjectURL(blob);
          setResolvedSrc(createdBlobUrl);
          setLoadingSrc(false);
        })
        .catch(() => {
          if (!active) return;
          setResolvedSrc(imageSrc);
          setLoadingSrc(false);
        });
    } else {
      setResolvedSrc(imageSrc);
      setLoadingSrc(false);
    }

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [imageSrc]);

  // Load natural dimensions of source image
  useEffect(() => {
    if (!resolvedSrc) return;
    const img = new Image();
    img.src = resolvedSrc;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
  }, [resolvedSrc]);

  // Screen crop box dimensions (16:10 ratio)
  const maxBoxW = Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 64 : 480);
  const boxW = maxBoxW;
  const boxH = Math.round(boxW / HERO_CARD_CONFIG.ratio); // e.g. 480 x 300 (16:10)

  // Effective dimensions considering rotation
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const effectiveW = isRotated90or270 ? naturalSize.height : naturalSize.width;
  const effectiveH = isRotated90or270 ? naturalSize.width : naturalSize.height;

  // Base scale so image fully covers the crop viewport at zoom = 1
  const baseScale = (effectiveW > 0 && effectiveH > 0)
    ? Math.max(boxW / effectiveW, boxH / effectiveH)
    : 1;

  const currentScale = baseScale * zoom;
  const renderedW = effectiveW * currentScale;
  const renderedH = effectiveH * currentScale;

  const maxPanX = Math.max(0, (renderedW - boxW) / 2);
  const maxPanY = Math.max(0, (renderedH - boxH) / 2);

  // Helper to clamp pan coordinates
  const clampPan = useCallback((x, y, limitX = maxPanX, limitY = maxPanY) => ({
    x: Math.max(-limitX, Math.min(limitX, x)),
    y: Math.max(-limitY, Math.min(limitY, y))
  }), [maxPanX, maxPanY]);

  // Keep pan clamped when zoom/rotation changes
  useEffect(() => {
    setPan(prev => clampPan(prev.x, prev.y, maxPanX, maxPanY));
  }, [clampPan, maxPanX, maxPanY, rotation, zoom]);

  // Drag handlers using Pointer Events
  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setPan(clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy));
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(z => Math.max(1, Math.min(3, +(z + delta).toFixed(2))));
  };

  // Rotate 90° Clockwise
  const handleRotate = () => {
    setRotation(r => (r + 90) % 360);
    setPan({ x: 0, y: 0 });
  };

  // Reset adjustments
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Perform High-Resolution Canvas Export (1280x800px, 16:10)
  const handleApplyCrop = () => {
    if (!resolvedSrc || naturalSize.width === 0 || naturalSize.height === 0) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = resolvedSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const exportW = HERO_CARD_CONFIG.exportW;
        const exportH = HERO_CARD_CONFIG.exportH;

        canvas.width = exportW;
        canvas.height = exportH;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Ratio mapping viewport display pixels to canvas export pixels
        const exportScale = exportW / boxW;

        // Fill background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportW, exportH);

        // Center on canvas + translated user pan
        ctx.translate(exportW / 2 + pan.x * exportScale, exportH / 2 + pan.y * exportScale);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(currentScale * exportScale, currentScale * exportScale);

        // Draw original natural image centered
        ctx.drawImage(
          img,
          -naturalSize.width / 2,
          -naturalSize.height / 2,
          naturalSize.width,
          naturalSize.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Could not generate cropped image.');
            setIsProcessing(false);
            return;
          }

          const baseCleanName = fileName.replace(/\.[^/.]+$/, '');
          const croppedFileName = `${baseCleanName}-hero-cropped.jpg`;
          const croppedFile = new File([blob], croppedFileName, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);

          setIsProcessing(false);
          onCropComplete(croppedFile, previewUrl);
        }, 'image/jpeg', 0.92);
      } catch (err) {
        console.error('Crop processing failed', err);
        alert('Crop processing failed. Please try again.');
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      alert('Failed to load image for cropping.');
      setIsProcessing(false);
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 20, 14, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '16px',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
          border: '1px solid #F6DFCA',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #FFF2DF',
            backgroundColor: '#FFFDF9'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
              ✂️ Crop & Focus Hero Photo
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#6B5E52', margin: '2px 0 0 0' }}>
              Drag to position dish • Zoom slider to focus • Fits hero card 100% full
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: '#FFF5E8',
              border: '1px solid #F6DFCA',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B5E52'
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Toolbar: Hero Card framing + Rotate + Reset only */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#FFF8EE',
            borderBottom: '1px solid #F6DFCA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFEDD5',
                color: '#C2410C',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: '1px solid #FED7AA'
              }}
            >
              🖼️ Hero Card Framing (16:10)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90 degrees"
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #E5D5C5',
                backgroundColor: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#2B2118',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔄 Rotate 90°
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset position and zoom"
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #E5D5C5',
                backgroundColor: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#6B5E52',
                cursor: 'pointer'
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Viewport & Drag Canvas Container */}
        <div
          style={{
            backgroundColor: '#1E1813',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            position: 'relative',
            userSelect: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Active 16:10 Crop Box */}
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{
              width: `${boxW}px`,
              height: `${boxH}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '14px',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 8px 24px rgba(0, 0, 0, 0.45)',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
          >
            {/* The Transformed Image */}
            {naturalSize.width > 0 && resolvedSrc && (
              <img
                src={resolvedSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${naturalSize.width}px`,
                  height: `${naturalSize.height}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${currentScale})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  display: 'block'
                }}
              />
            )}

            {/* Rule-of-Thirds Composition Grid */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr'
              }}
            >
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.4)' }} />
              <div />
            </div>

            {/* Corner Markers */}
            <div style={{ position: 'absolute', top: 4, left: 4, width: 14, height: 14, borderTop: '3px solid #FFF', borderLeft: '3px solid #FFF', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderTop: '3px solid #FFF', borderRight: '3px solid #FFF', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 4, left: 4, width: 14, height: 14, borderBottom: '3px solid #FFF', borderLeft: '3px solid #FFF', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderBottom: '3px solid #FFF', borderRight: '3px solid #FFF', pointerEvents: 'none' }} />

            {/* Drag Hint */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#FFFFFF',
                fontSize: '0.66rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '9999px',
                pointerEvents: 'none',
                backdropFilter: 'blur(2px)',
                whiteSpace: 'nowrap'
              }}
            >
              🖐️ Drag dish to position • Wheel to zoom
            </div>
          </div>
        </div>

        {/* Zoom Slider Control */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#FFFDF9',
            borderTop: '1px solid #FFF2DF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B5E52' }}>
            🔍 Zoom:
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1px solid #E5D5C5',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            -
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.02"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              width: '200px',
              accentColor: '#C2410C',
              cursor: 'pointer'
            }}
          />
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1px solid #E5D5C5',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            +
          </button>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C2410C', minWidth: '40px' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Modal Footer / Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F6DFCA'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#6B5E52' }}>
            Framing: <strong style={{ color: '#C2410C' }}>Hero Card</strong> (1280 × 800px) • Full Container Fit
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn btn-secondary"
              style={{ minHeight: '34px', padding: '0 16px', fontSize: '0.78rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || naturalSize.width === 0}
              className="btn btn-primary"
              style={{
                minHeight: '34px',
                padding: '0 20px',
                fontSize: '0.78rem',
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? 'Processing Crop...' : '✓ Confirm & Crop Photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
