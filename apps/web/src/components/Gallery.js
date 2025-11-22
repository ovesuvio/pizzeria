import Image from 'next/image';
import { useState } from 'react';

export default function Gallery({ images = [] }) {
  const [failed, setFailed] = useState(new Set());
  return (
    <div
      className="gallery-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12
      }}
    >
      {images.map((img, idx) => (
        failed.has(idx) ? null : (
        <div
          key={idx}
          className="gallery-item"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ width: '100%', height: 160, position: 'relative' }}>
            <Image
              src={img.src}
              alt=""
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              priority={idx < 6}
              onError={() => {
                setFailed((prev) => {
                  const next = new Set(prev);
                  next.add(idx);
                  return next;
                });
              }}
            />
          </div>
        </div>
        )
      ))}
    </div>
  );
}