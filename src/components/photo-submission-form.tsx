"use client";

import { useEffect, useId, useRef, useState, useActionState } from "react";
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, Plus } from "lucide-react";
import type { TransactionActionState } from "@/app/actions/transactions";

type PhotoSubmissionFormProps = {
  action: (
    state: TransactionActionState,
    formData: FormData,
  ) => Promise<TransactionActionState>;
};

const initialState: TransactionActionState = {};
const maxUploadBytes = 8 * 1024 * 1024;
const compressionTargetBytes = 2 * 1024 * 1024;
const maxImageSide = 1600;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function resizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Cannot read selected image."));
      image.src = imageUrl;
    });

    const scale = Math.min(1, maxImageSide / Math.max(image.width, image.height));

    if (scale === 1 && file.size <= compressionTargetBytes) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.74, 0.66]) {
      const blob = await canvasToBlob(canvas, quality);

      if (!blob) {
        continue;
      }

      const compressedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "") + ".jpg",
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        },
      );

      if (compressedFile.size < file.size || compressedFile.size <= compressionTargetBytes) {
        return compressedFile;
      }
    }

    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function replaceInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

export function PhotoSubmissionForm({ action }: PhotoSubmissionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    setClientError(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    if (!file) {
      return;
    }

    setIsPreparingPhoto(true);

    try {
      const preparedFile = await resizeImage(file);

      if (preparedFile.size > maxUploadBytes) {
        setClientError(
          `Фото слишком большое: ${formatBytes(preparedFile.size)}. Нужно до ${formatBytes(maxUploadBytes)}.`,
        );
        event.currentTarget.value = "";
        return;
      }

      replaceInputFile(event.currentTarget, preparedFile);
      setSelectedFile(preparedFile);
      setPreviewUrl(URL.createObjectURL(preparedFile));
    } catch {
      setClientError("Не удалось подготовить фото. Попробуй выбрать другое фото.");
      event.currentTarget.value = "";
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (clientError || isPreparingPhoto || !inputRef.current?.files?.[0]) {
      event.preventDefault();
    }
  }

  const disabled = pending || isPreparingPhoto || Boolean(clientError);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor={inputId}
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-slate-400 hover:bg-slate-50"
        >
          {previewUrl ? (
            <span className="flex w-full items-center gap-4 text-left">
              <span className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Фото готово
                </span>
                <span className="mt-1 block truncate text-sm text-slate-700">
                  {selectedFile?.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {selectedFile ? formatBytes(selectedFile.size) : null}
                </span>
              </span>
            </span>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white">
                {isPreparingPhoto ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <span className="mt-3 text-sm font-semibold text-slate-900">
                {isPreparingPhoto ? "Готовим фото..." : "Сфоткать или выбрать фото"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Фото будет уменьшено перед отправкой
              </span>
            </>
          )}
        </label>

        <input
          ref={inputRef}
          id={inputId}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={handlePhotoChange}
          required
        />
      </div>

      <input
        name="note"
        type="text"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-400"
        placeholder="Комментарий, если нужен"
        maxLength={180}
      />

      {clientError || state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {clientError ?? state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : selectedFile ? (
          <Plus className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? "Отправляем..." : "Отправить на проверку"}
      </button>
    </form>
  );
}
