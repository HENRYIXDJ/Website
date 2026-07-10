'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';
import PageShell from '@/components/PageShell';

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <PageShell>
      <div className="max-w-md mx-auto my-12 p-8 bg-zinc-950/80 border border-zinc-900 rounded-2xl shadow-2xl backdrop-blur-md">
        <h1 className="font-sans font-black text-2xl text-zinc-100 tracking-wider uppercase mb-6 text-center">
          Upload Your Avatar
        </h1>

        <form
          className="flex flex-col gap-6"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!inputFileRef.current?.files) {
              throw new Error("No file selected");
            }

            const file = inputFileRef.current.files[0];
            setIsSubmitting(true);

            try {
              const response = await fetch(
                `/api/avatar/upload?filename=${file.name}`,
                {
                  method: 'POST',
                  body: file,
                },
              );

              const newBlob = (await response.json()) as PutBlobResult;
              setBlob(newBlob);
            } catch (error) {
              console.error(error);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 pl-1">
              Select Image File (JPEG, PNG, WEBP)
            </label>
            <input
              name="file"
              ref={inputFileRef}
              type="file"
              accept="image/jpeg, image/png, image/webp"
              required
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-4 py-3 text-xs font-mono tracking-wider text-zinc-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-zinc-700 file:bg-zinc-800 file:text-[10px] file:font-mono file:text-zinc-200 file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-zinc-700/80 file:transition-colors focus:outline-none focus:border-primary placeholder-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-widest font-black py-3.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Uploading..." : "Upload"}
          </button>
        </form>

        {blob && (
          <div className="mt-8 p-4 bg-zinc-900/40 border border-zinc-900 rounded-lg text-center flex flex-col gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Upload Successful
            </span>
            <a
              href={blob.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-primary hover:underline break-all"
            >
              {blob.url}
            </a>
          </div>
        )}
      </div>
    </PageShell>
  );
}
