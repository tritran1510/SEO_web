import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../../../shared/ui/Field";
import { RichTextField } from "../../../shared/ui/RichTextField";
import { ContentImagesField } from "./ContentImagesField";
import type { SeoReviewWorkspace } from "../model/useSeoReviewWorkspace";

type SeoReviewFormProps = {
  workspace: SeoReviewWorkspace;
};

export function SeoReviewForm({ workspace }: SeoReviewFormProps) {
  const { t } = useTranslation();
  const { form } = workspace;
  const [keywordInput, setKeywordInput] = useState("");
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
  const articleTitleField = workspace.getFieldPresentation("articleTitle");
  const permanentLinkField = workspace.getFieldPresentation("permanentLink");
  const articleContentField = workspace.getFieldPresentation("articleContent");
  const contentImagesField = workspace.getFieldPresentation("contentImages");
  const detailedInformationField = workspace.getFieldPresentation("detailedInformation");
  const summaryField = workspace.getFieldPresentation("summary");
  const seoTitleField = workspace.getFieldPresentation("seoTitle");
  const slugField = workspace.getFieldPresentation("slug");
  const metaDescriptionField = workspace.getFieldPresentation("metaDescription");
  const primaryKeywordField = workspace.getFieldPresentation("primaryKeyword");
  const secondaryKeywordsField = workspace.getFieldPresentation("secondaryKeywords");
  const synonymsField = workspace.getFieldPresentation("synonyms");
  const secondaryKeywordList = useMemo(
    () =>
      form.keywordSet.secondaryKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
    [form.keywordSet.secondaryKeywords],
  );

  const commitSecondaryKeyword = () => {
    const normalizedKeyword = keywordInput.trim();
    if (normalizedKeyword.length === 0) {
      return;
    }

    const nextKeywords =
      editingKeywordIndex === null
        ? [...secondaryKeywordList, normalizedKeyword]
        : secondaryKeywordList.map((item, index) => (index === editingKeywordIndex ? normalizedKeyword : item));

    workspace.updateKeywordField("secondaryKeywords", nextKeywords.join(", "));
    setKeywordInput("");
    setEditingKeywordIndex(null);
  };

  const editSecondaryKeyword = (index: number) => {
    setKeywordInput(secondaryKeywordList[index] ?? "");
    setEditingKeywordIndex(index);
  };

  const removeSecondaryKeyword = (index: number) => {
    const nextKeywords = secondaryKeywordList.filter((_, itemIndex) => itemIndex !== index);
    workspace.updateKeywordField("secondaryKeywords", nextKeywords.join(", "));
    if (editingKeywordIndex === index) {
      setKeywordInput("");
      setEditingKeywordIndex(null);
    }
  };

  return (
    <section className="editor">
      <div className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{t("seoReview.form.articleInputEyebrow")}</p>
            <h2>{t("seoReview.form.coreContentTitle")}</h2>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void workspace.runReview();
            }}
            disabled={workspace.isReviewing}
          >
            {workspace.isReviewing ? t("seoReview.form.reviewing") : t("seoReview.form.runReview")}
          </button>
        </div>

        {workspace.reviewError ? <p className="panel__error">{workspace.reviewError}</p> : null}

        <div className="form-grid">
          <Field
            label={t("seoReview.fields.articleTitle.label")}
            value={form.articleTitle}
            onChange={(event) => workspace.updateField("articleTitle", event.target.value)}
            placeholder={t("seoReview.fields.articleTitle.placeholder")}
            helperText={t("seoReview.fields.articleTitle.helperText")}
            tone={articleTitleField.tone}
            issues={articleTitleField.issues}
          />
          <Field
            label={t("seoReview.fields.permanentLink.label")}
            value={form.permanentLink}
            onChange={(event) => workspace.updateField("permanentLink", event.target.value)}
            placeholder={t("seoReview.fields.permanentLink.placeholder")}
            helperText={t("seoReview.fields.permanentLink.helperText")}
            tone={permanentLinkField.tone}
            issues={permanentLinkField.issues}
          />
          <div className="form-grid__full">
            <RichTextField
              label={t("seoReview.fields.articleContent.label")}
              value={form.articleContent}
              onChange={(nextValue) => workspace.updateField("articleContent", nextValue)}
              placeholder={t("seoReview.fields.articleContent.placeholder")}
              helperText={t("seoReview.fields.articleContent.helperText")}
              tone={articleContentField.tone}
              issues={articleContentField.issues}
              minHeight={220}
              mediaItems={form.contentImages}
              onAddMediaFiles={workspace.addImagesFromFiles}
            />
          </div>
          <div className="form-grid__full">
            <ContentImagesField
              images={form.contentImages}
              imageError={workspace.imageError}
              issues={contentImagesField.issues}
              fileInputRef={workspace.fileInputRef}
              onFileSelection={workspace.handleFileSelection}
              onPasteImages={workspace.handlePasteImages}
              onDropImages={workspace.handleDropImages}
              onRemoveImage={workspace.removeImage}
              onUpdateImageInfo={workspace.updateImageInfo}
            />
          </div>
          <div className="keyword-inline-field form-grid__full">
            <label className="field__label">{t("seoReview.fields.secondaryKeywords.label")}</label>
            <div className="keyword-list-editor">
              <input
                type="text"
                className={
                  secondaryKeywordsField.tone === "attention" ? "field__control field__control--attention" : "field__control"
                }
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitSecondaryKeyword();
                  }
                }}
                placeholder={t("seoReview.fields.secondaryKeywords.placeholder")}
              />
              <button type="button" className="ghost-button" onClick={commitSecondaryKeyword}>
                {editingKeywordIndex === null
                  ? t("seoReview.fields.secondaryKeywords.addAction")
                  : t("seoReview.fields.secondaryKeywords.saveAction")}
              </button>
            </div>
            <span className="field__helper">{t("seoReview.fields.secondaryKeywords.helperText")}</span>
            <div className="keyword-chip-list">
              {secondaryKeywordList.map((keyword, index) => (
                <div key={`${keyword}-${index}`} className="keyword-chip">
                  <span>{keyword}</span>
                  <button type="button" className="keyword-chip__action" onClick={() => editSecondaryKeyword(index)}>
                    {t("seoReview.fields.secondaryKeywords.editAction")}
                  </button>
                  <button type="button" className="keyword-chip__action" onClick={() => removeSecondaryKeyword(index)}>
                    {t("common.actions.remove")}
                  </button>
                </div>
              ))}
            </div>
            {secondaryKeywordsField.issues.length > 0 ? (
              <ul className="field__issues">
                {secondaryKeywordsField.issues.slice(0, 2).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="keyword-inline-field form-grid__full">
            <Field
              label={t("seoReview.fields.primaryKeyword.label")}
              value={form.keywordSet.primaryKeyword}
              onChange={(event) => workspace.updateKeywordField("primaryKeyword", event.target.value)}
              placeholder={t("seoReview.fields.primaryKeyword.placeholder")}
              helperText={t("seoReview.fields.primaryKeyword.helperText")}
              tone={primaryKeywordField.tone}
              issues={primaryKeywordField.issues}
            />
          </div>
          <div className="form-grid__full">
            <Field
              label={t("seoReview.fields.seoTitle.label")}
              value={form.keywordSet.seoTitle}
              onChange={(event) => workspace.updateKeywordField("seoTitle", event.target.value)}
              placeholder={t("seoReview.fields.seoTitle.placeholder")}
              helperText={t("seoReview.fields.seoTitle.helperText")}
              tone={seoTitleField.tone}
              issues={seoTitleField.issues}
            />
          </div>
          <div className="form-grid__full">
            <Field
              label={t("seoReview.fields.slug.label")}
              value={form.keywordSet.slug}
              onChange={(event) => workspace.updateKeywordField("slug", event.target.value)}
              placeholder={t("seoReview.fields.slug.placeholder")}
              helperText={t("seoReview.fields.slug.helperText")}
              tone={slugField.tone}
              issues={slugField.issues}
            />
          </div>
          <div className="form-grid__full">
            <Field
              as="textarea"
              rows={3}
              label={t("seoReview.fields.metaDescription.label")}
              value={form.keywordSet.metaDescription}
              onChange={(event) => workspace.updateKeywordField("metaDescription", event.target.value)}
              placeholder={t("seoReview.fields.metaDescription.placeholder")}
              helperText={t("seoReview.fields.metaDescription.helperText")}
              tone={metaDescriptionField.tone}
              issues={metaDescriptionField.issues}
            />
          </div>
          <div className="form-grid__full">
            <Field
              label={t("seoReview.fields.synonyms.label")}
              value={form.keywordSet.synonyms}
              onChange={(event) => workspace.updateKeywordField("synonyms", event.target.value)}
              placeholder={t("seoReview.fields.synonyms.placeholder")}
              helperText={t("seoReview.fields.synonyms.helperText")}
              tone={synonymsField.tone}
              issues={synonymsField.issues}
            />
          </div>
          <div className="form-grid__full">
            <RichTextField
              label={t("seoReview.fields.detailedInformation.label")}
              value={form.detailedInformation}
              onChange={(nextValue) => workspace.updateField("detailedInformation", nextValue)}
              placeholder={t("seoReview.fields.detailedInformation.placeholder")}
              helperText={t("seoReview.fields.detailedInformation.helperText")}
              tone={detailedInformationField.tone}
              issues={detailedInformationField.issues}
              minHeight={140}
              mediaItems={form.contentImages}
              onAddMediaFiles={workspace.addImagesFromFiles}
            />
          </div>
          <div className="form-grid__full">
            <RichTextField
              label={t("seoReview.fields.summary.label")}
              value={form.summary}
              onChange={(nextValue) => workspace.updateField("summary", nextValue)}
              placeholder={t("seoReview.fields.summary.placeholder")}
              helperText={t("seoReview.fields.summary.helperText")}
              tone={summaryField.tone}
              issues={summaryField.issues}
              minHeight={120}
              mediaItems={form.contentImages}
              onAddMediaFiles={workspace.addImagesFromFiles}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
