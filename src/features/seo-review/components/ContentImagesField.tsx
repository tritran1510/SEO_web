import { createPortal } from "react-dom";
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
  onUpdateImageInfo: (
    imageId: string,
    updates: {
      name?: string;
      mimeType?: string;
      altText?: string;
      title?: string;
      caption?: string;
      description?: string;
    },
  ) => void;
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
  const [imageAltTextInput, setImageAltTextInput] = useState("");
  const [imageTitleInput, setImageTitleInput] = useState("");
  const [imageCaptionInput, setImageCaptionInput] = useState("");
  const [imageDescriptionInput, setImageDescriptionInput] = useState("");

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? null,
    [images, selectedImageId],
  );

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImageId(null);
      setImageNameInput("");
      setImageAltTextInput("");
      setImageTitleInput("");
      setImageCaptionInput("");
      setImageDescriptionInput("");
      return;
    }

    if (!selectedImageId) {
      const firstImage = images[0];
      setSelectedImageId(firstImage.id);
      setImageNameInput(firstImage.name);
      setImageAltTextInput(firstImage.altText);
      setImageTitleInput(firstImage.title);
      setImageCaptionInput(firstImage.caption);
      setImageDescriptionInput(firstImage.description);
      return;
    }

    const current = images.find((image) => image.id === selectedImageId);
    if (!current) {
      const firstImage = images[0];
      setSelectedImageId(firstImage.id);
      setImageNameInput(firstImage.name);
      setImageAltTextInput(firstImage.altText);
      setImageTitleInput(firstImage.title);
      setImageCaptionInput(firstImage.caption);
      setImageDescriptionInput(firstImage.description);
      return;
    }

    setImageNameInput(current.name);
    setImageAltTextInput(current.altText);
    setImageTitleInput(current.title);
    setImageCaptionInput(current.caption);
    setImageDescriptionInput(current.description);
  }, [images, selectedImageId]);

  const handleSelectImage = (image: ImportedImage) => {
    setSelectedImageId(image.id);
    setImageNameInput(image.name);
    setImageAltTextInput(image.altText);
    setImageTitleInput(image.title);
    setImageCaptionInput(image.caption);
    setImageDescriptionInput(image.description);
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

      {isDialogOpen ? createPortal(
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
                  <span className="field__label">{t("seoReview.imageInput.fields.fileNameLabel")}</span>
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
                  <span className="field__label">{t("seoReview.imageInput.fields.altTextLabel")}</span>
                  <input
                    className="field__control"
                    value={imageAltTextInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageAltTextInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { altText: nextValue });
                      }
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field__label">{t("seoReview.imageInput.fields.titleLabel")}</span>
                  <input
                    className="field__control"
                    value={imageTitleInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageTitleInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { title: nextValue });
                      }
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field__label">{t("seoReview.imageInput.fields.captionLabel")}</span>
                  <input
                    className="field__control"
                    value={imageCaptionInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageCaptionInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { caption: nextValue });
                      }
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field__label">{t("seoReview.imageInput.fields.descriptionLabel")}</span>
                  <textarea
                    className="field__control"
                    rows={4}
                    value={imageDescriptionInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setImageDescriptionInput(nextValue);
                      if (selectedImage) {
                        onUpdateImageInfo(selectedImage.id, { description: nextValue });
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
        </div>,
        document.body
      ) : null}
    </div>
  );
}
