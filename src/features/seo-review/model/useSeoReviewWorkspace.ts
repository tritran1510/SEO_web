import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { requestSeoReview } from "../api/reviewApi";
import {
  buildPresentedFieldFeedback,
  buildTopRecommendations,
  getReviewStatusLabel,
  presentChecklistItems,
  translateReviewErrorMessage,
} from "./reviewPresentation";
import type {
  ArticleFormData,
  ArticleFormField,
  FieldPresentation,
  ImportedImage,
  KeywordSetField,
  PresentedChecklistResult,
  PresentedFieldFeedback,
  ReviewFieldKey,
  ReviewReport,
} from "./types";

const EMPTY_ARTICLE_FORM: ArticleFormData = {
  articleTitle: "",
  permanentLink: "",
  articleContent: "",
  contentImages: [],
  detailedInformation: "",
  summary: "",
  keywordSet: {
    seoTitle: "",
    slug: "",
    metaDescription: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    synonyms: "",
  },
};

const readImageFile = (file: File): Promise<ImportedImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Could not read image ${file.name}.`));
        return;
      }

      resolve({
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        dataUrl: reader.result,
        altText: "",
        title: "",
        caption: "",
        description: "",
      });
    };

    reader.onerror = () => {
      reject(new Error(`Could not read image ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });

const EMPTY_ISSUES: string[] = [];

function getImageFiles(files: File[]): File[] {
  return files.filter((file) => file.type.startsWith("image/"));
}

export type SeoReviewWorkspace = {
  form: ArticleFormData;
  report: ReviewReport | null;
  isReviewing: boolean;
  reviewError: string;
  imageError: string;
  statusLabel: string;
  topRecommendations: string[];
  fieldFeedback: PresentedFieldFeedback[];
  fileInputRef: RefObject<HTMLInputElement>;
  groupedChecklist: {
    seo: PresentedChecklistResult[];
    advanced: PresentedChecklistResult[];
    readability: PresentedChecklistResult[];
  };
  getFieldIssues: (field: ReviewFieldKey) => string[];
  getFieldPresentation: (field: ReviewFieldKey) => FieldPresentation;
  updateField: <K extends ArticleFormField>(name: K, value: ArticleFormData[K]) => void;
  updateKeywordField: <K extends KeywordSetField>(
    name: K,
    value: ArticleFormData["keywordSet"][K],
  ) => void;
  handleFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePasteImages: (event: ClipboardEvent<HTMLDivElement>) => Promise<void>;
  handleDropImages: (event: DragEvent<HTMLDivElement>) => Promise<void>;
  removeImage: (imageId: string) => void;
  updateImageInfo: (
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
  addImagesFromFiles: (files: File[]) => Promise<void>;
  runReview: () => Promise<void>;
};

export function useSeoReviewWorkspace(): SeoReviewWorkspace {
  const { t } = useTranslation();
  const [form, setForm] = useState<ArticleFormData>(EMPTY_ARTICLE_FORM);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presentedChecklist = useMemo(
    () => presentChecklistItems(t, report?.checklistResults ?? []),
    [report, t],
  );

  const fieldFeedback = useMemo(
    () => buildPresentedFieldFeedback(t, presentedChecklist),
    [presentedChecklist, t],
  );

  const topRecommendations = useMemo(
    () => buildTopRecommendations(presentedChecklist),
    [presentedChecklist],
  );

  const statusLabel = useMemo(() => {
    if (!report) {
      return t("common.status.ready");
    }

    return getReviewStatusLabel(t, report.status);
  }, [report, t]);

  const fieldFeedbackMap = useMemo(
    () => new Map(fieldFeedback.map((item) => [item.field, item.messages])),
    [fieldFeedback],
  );

  const groupedChecklist = useMemo(
    () => ({
      seo: presentedChecklist.filter((item) => item.group === "SEO"),
      advanced: presentedChecklist.filter((item) => item.group === "Advanced"),
      readability: presentedChecklist.filter((item) => item.group === "Readability"),
    }),
    [presentedChecklist],
  );

  const updateField = <K extends ArticleFormField>(name: K, value: ArticleFormData[K]) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateKeywordField = <K extends KeywordSetField>(
    name: K,
    value: ArticleFormData["keywordSet"][K],
  ) => {
    setForm((current) => ({
      ...current,
      keywordSet: {
        ...current.keywordSet,
        [name]: value,
      },
    }));
  };

  const getFieldIssues = (field: ReviewFieldKey): string[] => fieldFeedbackMap.get(field) ?? EMPTY_ISSUES;

  const getFieldPresentation = (field: ReviewFieldKey): FieldPresentation => {
    const issues = getFieldIssues(field);
    return {
      issues,
      tone: issues.length > 0 ? "attention" : "default",
    };
  };

  const reviewContent = async (payload: ArticleFormData) => {
    setIsReviewing(true);
    setReviewError("");

    try {
      // The frontend sends the full editorial payload and trusts the backend to compute the review.
      const nextReport = await requestSeoReview(payload);
      setReport(nextReport);
    } catch (error) {
      setReviewError(translateReviewErrorMessage(t, error));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleAddImages = async (files: File[]) => {
    const imageFiles = getImageFiles(files);

    if (imageFiles.length === 0) {
      setImageError(t("seoReview.errors.imageOnly"));
      return;
    }

    try {
      const nextImages = await Promise.all(imageFiles.map((file) => readImageFile(file)));
      setForm((current) => ({
        ...current,
        contentImages: [...current.contentImages, ...nextImages],
      }));
      setImageError("");
    } catch {
      setImageError(t("seoReview.errors.imageReadFailed"));
    }
  };

  const removeImage = (imageId: string) => {
    setForm((current) => ({
      ...current,
      contentImages: current.contentImages.filter((image) => image.id !== imageId),
    }));
  };

  const updateImageInfo = (
    imageId: string,
    updates: {
      name?: string;
      mimeType?: string;
      altText?: string;
      title?: string;
      caption?: string;
      description?: string;
    },
  ) => {
    setForm((current) => ({
      ...current,
      contentImages: current.contentImages.map((image) =>
        image.id === imageId
          ? {
              ...image,
              name: updates.name ?? image.name,
              mimeType: updates.mimeType ?? image.mimeType,
              altText: updates.altText ?? image.altText,
              title: updates.title ?? image.title,
              caption: updates.caption ?? image.caption,
              description: updates.description ?? image.description,
            }
          : image,
      ),
    }));
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      await handleAddImages(files);
    }
    event.target.value = "";
  };

  const handlePasteImages = async (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (pastedImages.length > 0) {
      event.preventDefault();
      await handleAddImages(pastedImages);
    }
  };

  const handleDropImages = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await handleAddImages(files);
    }
  };

  const runReview = async () => {
    await reviewContent(form);
  };
  return {
    form,
    report,
    isReviewing,
    reviewError,
    imageError,
    statusLabel,
    topRecommendations,
    fieldFeedback,
    fileInputRef,
    groupedChecklist,
    getFieldIssues,
    getFieldPresentation,
    updateField,
    updateKeywordField,
    handleFileSelection,
    handlePasteImages,
    handleDropImages,
    removeImage,
    updateImageInfo,
    addImagesFromFiles: handleAddImages,
    runReview,
  };
}
