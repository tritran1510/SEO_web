import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, RefObject } from "react";
import type { ImportedImage } from "../model/types";

type ContentImagesFieldProps = {
  images: ImportedImage[];
  imageError: string;
  issues: string[];
  fileInputRef: RefObject<HTMLInputElement>;
  onFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPasteImages: (event: ClipboardEvent<HTMLDivElement>) => Promise<void>;
  onDropImages: (event: DragEvent<HTMLDivElement>) => Promise<void>;
  onRemoveImage: (imageId: string) => void;
  onUpdateImageInfo: (imageId: string, updates: { name?: string; mimeType?: string }) => void;
};

export function ContentImagesField({
  images,
  imageError,
  issues,
  fileInputRef,
  onFileSelection,
  onPasteImages,
  onDropImages,
  onRemoveImage,
  onUpdateImageInfo,
}: ContentImagesFieldProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageNameInput, setImageNameInput] = useState("");
  const [imageMimeInput, setImageMimeInput] = useState("");

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? null,
    [images, selectedImageId],
  );

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImageId(null);
      setImageNameInput("");
      setImageMimeInput("");
      return;
    }

    if (!selectedImageId) {
      const firstImage = images[0];
      setSelectedImageId(firstImage.id);
      setImageNameInput(firstImage.name);
      setImageMimeInput(firstImage.mimeType);
      return;
    }

    const current = images.find((image) => image.id === selectedImageId);
    if (!current) {
      const firstImage = images[0];
      setSelectedImageId(firstImage.id);
      setImageNameInput(firstImage.name);
      setImageMimeInput(firstImage.mimeType);
      return;
    }

    setImageNameInput(current.name);
    setImageMimeInput(current.mimeType);
  }, [images, selectedImageId]);

  const handleSelectImage = (image: ImportedImage) => {
    setSelectedImageId(image.id);
    setImageNameInput(image.name);
    setImageMimeInput(image.mimeType);
  };

  return (
    <div className="field">
      <span className="field__label">{t("seoReview.fields.contentImages.label")}</span>
      <div
        className={`image-dropzone${issues.length > 0 ? " image-dropzone--attention" : ""}`}
        aria-invalid={issues.length > 0}
        aria-label={t("seoReview.imageInput.ariaLabel")}
        onPaste={(event) => {
          void onPasteImages(event);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          void onDropImages(event);
        }}
        tabIndex={0}
        role="button"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <p className="image-dropzone__title">{t("seoReview.imageInput.title")}</p>
        <p className="image-dropzone__text">{t("seoReview.imageInput.description")}</p>
        <button
          type="button"
          className="ghost-button"
          onClick={(event) => {
            event.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {t("seoReview.imageInput.chooseFiles")}
        </button>
        <input
          ref={fileInputRef}
          aria-label={t("seoReview.imageInput.chooseFilesAria")}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            void onFileSelection(event);
          }}
        />
      </div>
      <span className="field__helper">{t("seoReview.fields.contentImages.helperText")}</span>
      {imageError ? <span className="field__helper field__helper--danger">{imageError}</span> : null}
      {issues.length > 0 ? (
        <ul className="field__issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      {images.length > 0 ? (
        <div className="image-manager">
          <div className="image-grid image-grid--compact">
            {images.slice(0, 6).map((image) => (
              <button
                key={image.id}
                type="button"
                className="image-grid__thumb-button"
                onClick={() => {
                  handleSelectImage(image);
                  setIsDialogOpen(true);
                }}
              >
                <img src={image.dataUrl} alt={image.name} className="image-card__preview" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              if (!selectedImageId && images[0]) {
                handleSelectImage(images[0]);
              }
              setIsDialogOpen(true);
            }}
          >
            {t("seoReview.imageInput.openImageDialog", { count: images.length })}
          </button>
        </div>
      ) : null}

      {isDialogOpen ? (
        <div className="image-dialog__backdrop" role="presentation" onClick={() => setIsDialogOpen(false)}>
          <div
            className="image-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("seoReview.imageInput.dialogTitle")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-dialog__header">
              <h3>{t("seoReview.imageInput.dialogTitle")}</h3>
              <button type="button" className="ghost-button" onClick={() => setIsDialogOpen(false)}>
                {t("common.actions.close")}
              </button>
            </div>

            <div className="image-dialog__body">
              <div className="image-grid image-grid--dialog">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`image-grid__thumb-button ${
                      selectedImageId === image.id ? "image-grid__thumb-button--active" : ""
                    }`}
                    onClick={() => handleSelectImage(image)}
                  >
                    <img src={image.dataUrl} alt={image.name} className="image-card__preview" />
                  </button>
                ))}
              </div>

              <div className="image-dialog__meta">
                <label className="field">
                  <span className="field__label">{t("seoReview.imageInput.fields.nameLabel")}</span>
                  <input
                    className="field__control"
                    value={imageNameInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageNameInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { name: nextValue });
                      }
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field__label">{t("seoReview.imageInput.fields.mimeTypeLabel")}</span>
                  <input
                    className="field__control"
                    value={imageMimeInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageMimeInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { mimeType: nextValue });
                      }
                    }}
                  />
                </label>

                {selectedImage ? (
                  <button
                    type="button"
                    className="ghost-button ghost-button--danger"
                    onClick={() => onRemoveImage(selectedImage.id)}
                  >
                    {t("common.actions.remove")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
