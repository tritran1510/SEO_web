import { useTranslation } from "react-i18next";
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
}: ContentImagesFieldProps) {
  const { t } = useTranslation();

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
        <div className="image-grid">
          {images.map((image) => (
            <article key={image.id} className="image-card">
              <img src={image.dataUrl} alt={image.name} className="image-card__preview" />
              <div className="image-card__footer">
                <div>
                  <p className="image-card__name">{image.name}</p>
                  <p className="image-card__meta">{image.mimeType}</p>
                </div>
                <button
                  type="button"
                className="ghost-button ghost-button--danger"
                onClick={() => onRemoveImage(image.id)}
              >
                  {t("common.actions.remove")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
