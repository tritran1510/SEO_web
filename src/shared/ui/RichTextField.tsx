import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  DecoratorNode,
  FORMAT_TEXT_COMMAND,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type NodeKey,
  type PointType,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

const DEFAULT_MIN_HEIGHT = 120;
const TOOLBAR_FONT_FAMILIES = ["Arial", "Georgia", "Tahoma", "Times New Roman", "Verdana"];
const TOOLBAR_FONT_SIZES = ["14px", "16px", "18px", "20px", "24px"];

type SerializedInlineImageNode = Spread<
  {
    alt: string;
    src: string;
    type: "inline-image";
    version: 1;
  },
  SerializedLexicalNode
>;

class InlineImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;

  static getType(): string {
    return "inline-image";
  }

  static clone(node: InlineImageNode): InlineImageNode {
    return new InlineImageNode(node.__src, node.__alt, node.__key);
  }

  static importJSON(serializedNode: SerializedInlineImageNode): InlineImageNode {
    return new InlineImageNode(serializedNode.src, serializedNode.alt);
  }

  exportJSON(): SerializedInlineImageNode {
    return {
      alt: this.__alt,
      src: this.__src,
      type: "inline-image",
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (domNode: Node) => {
        const image = domNode as HTMLImageElement;
        if (!image.src) {
          return null;
        }
        return {
          conversion: () =>
            ({ node: new InlineImageNode(image.src, image.alt || "") }) as DOMConversionOutput,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__alt);
    return { element };
  }

  constructor(src: string, alt: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "rich-editor__inline-image";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <img src={this.__src} alt={this.__alt} className="rich-editor__image" />;
  }
}

function $createInlineImageNode(src: string, alt: string): InlineImageNode {
  return new InlineImageNode(src, alt);
}

type RichTextFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  helperText?: string;
  issues?: string[];
  tone?: "default" | "attention";
  minHeight?: number;
  mediaItems?: Array<{ id: string; name: string; dataUrl: string; altText?: string }>;
  onAddMediaFiles?: (files: File[]) => Promise<void>;
};

export function RichTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  issues = [],
  tone = "default",
  minHeight = DEFAULT_MIN_HEIGHT,
  mediaItems = [],
  onAddMediaFiles,
}: RichTextFieldProps) {
  const lastAppliedHtmlRef = useRef(value || "");
  const helperId = id ? `${id}-helper` : undefined;
  const issuesId = id ? `${id}-issues` : undefined;
  const describedBy = [helperText ? helperId : undefined, issues.length > 0 ? issuesId : undefined]
    .filter(Boolean)
    .join(" ");
  const editorNamespace = useMemo(() => `seo-rich-text-${(id || label).replace(/\s+/g, "-").toLowerCase()}`, [id, label]);

  const initialConfig = useMemo(
    () => ({
      namespace: editorNamespace,
      onError: (error: Error) => {
        throw error;
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, TableNode, TableRowNode, TableCellNode, InlineImageNode],
      editorState: (editor: LexicalEditor) => {
        applyHtmlToEditor(editor, value || "");
      },
    }),
    [editorNamespace],
  );

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextToolbar mediaItems={mediaItems} onAddMediaFiles={onAddMediaFiles} />
        <div className="rich-editor-shell">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                className={tone === "attention" ? "rich-editor rich-editor--attention" : "rich-editor"}
                style={{ minHeight }}
                aria-invalid={issues.length > 0}
                aria-describedby={describedBy || undefined}
              />
            }
            placeholder={placeholder ? <span className="rich-editor__placeholder">{placeholder}</span> : null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TablePlugin />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const nextHtml = $generateHtmlFromNodes(editor);
              lastAppliedHtmlRef.current = nextHtml;
              onChange(nextHtml);
            });
          }}
        />
        <SyncHtmlValue value={value} lastAppliedHtmlRef={lastAppliedHtmlRef} />
      </LexicalComposer>
      {helperText ? (
        <span id={helperId} className="field__helper">
          {helperText}
        </span>
      ) : null}
      {issues.length > 0 ? (
        <ul id={issuesId} className="field__issues">
          {issues.slice(0, 2).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RichTextToolbar({
  mediaItems,
  onAddMediaFiles,
}: {
  mediaItems: Array<{ id: string; name: string; dataUrl: string; altText?: string }>;
  onAddMediaFiles?: (files: File[]) => Promise<void>;
}) {
  const [editor] = useLexicalComposerContext();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const lastSelectionRef = useRef<{
    anchor: { key: string; offset: number; type: PointType };
    focus: { key: string; offset: number; type: PointType };
  } | null>(null);

  const rememberSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        lastSelectionRef.current = {
          anchor: {
            key: selection.anchor.key,
            offset: selection.anchor.offset,
            type: selection.anchor.type,
          },
          focus: {
            key: selection.focus.key,
            offset: selection.focus.offset,
            type: selection.focus.type,
          },
        };
      }
    });
  };

  const applyFontFamily = (fontFamily: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-family": fontFamily });
      }
    });
  };

  const applyFontSize = (fontSize: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-size": fontSize });
      }
    });
  };

  const applyBlockType = (block: "paragraph" | "h1" | "h2" | "quote") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      if (block === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      if (block === "h1") {
        $setBlocksType(selection, () => $createHeadingNode("h1"));
        return;
      }
      if (block === "h2") {
        $setBlocksType(selection, () => $createHeadingNode("h2"));
        return;
      }
      $setBlocksType(selection, () => $createQuoteNode());
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) {
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const insertImage = (image: { id: string; name: string; dataUrl: string; altText?: string }) => {
    editor.update(() => {
      const savedSelection = lastSelectionRef.current;
      if (savedSelection) {
        const anchorNode = $getNodeByKey(savedSelection.anchor.key);
        const focusNode = $getNodeByKey(savedSelection.focus.key);
        if (anchorNode?.isAttached() && focusNode?.isAttached()) {
          const nextSelection = $createRangeSelection();
          nextSelection.anchor.set(savedSelection.anchor.key, savedSelection.anchor.offset, savedSelection.anchor.type);
          nextSelection.focus.set(savedSelection.focus.key, savedSelection.focus.offset, savedSelection.focus.type);
          $setSelection(nextSelection);
        }
      }
      const imageAlt = image.altText?.trim() || image.name;
      const imageNode = $createInlineImageNode(image.dataUrl, imageAlt);
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([imageNode]);
      } else {
        const root = $getRoot();
        root.append(imageNode);
      }
    });
    lastSelectionRef.current = null;
    setIsMediaDialogOpen(false);
  };

  return (
    <>
      <div className="rich-toolbar-row">
        <div className="rich-toolbar-top">
          <button
            type="button"
            className="rich-toolbar__button rich-toolbar__button--media"
            onMouseDown={rememberSelection}
            onClick={() => setIsMediaDialogOpen(true)}
            aria-label="Open media manager"
          >
            <span className="rich-toolbar__icon" aria-hidden>
              +
            </span>
            <span>Thêm Media</span>
          </button>
          <div className="rich-toolbar__mode-toggle" role="group" aria-label="Editor mode">
            <button type="button" className="rich-toolbar__mode rich-toolbar__mode--active" aria-pressed="true">
              Trực quan
            </button>
            <button type="button" className="rich-toolbar__mode" aria-pressed="false">
              Văn bản
            </button>
          </div>
        </div>
        <div className="rich-toolbar-scroll" role="toolbar" aria-label="Rich text formatting toolbar">
          <select className="rich-toolbar__select" onChange={(event) => applyFontFamily(event.target.value)} defaultValue="">
            <option value="" disabled>
              Font
            </option>
            {TOOLBAR_FONT_FAMILIES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          <select className="rich-toolbar__select" onChange={(event) => applyFontSize(event.target.value)} defaultValue="">
            <option value="" disabled>
              Size
            </option>
            {TOOLBAR_FONT_SIZES.map((fontSize) => (
              <option key={fontSize} value={fontSize}>
                {fontSize}
              </option>
            ))}
          </select>

          <button type="button" className="rich-toolbar__button" onClick={() => applyBlockType("paragraph")}>
            P
          </button>
          <button type="button" className="rich-toolbar__button" onClick={() => applyBlockType("h1")}>
            H1
          </button>
          <button type="button" className="rich-toolbar__button" onClick={() => applyBlockType("h2")}>
            H2
          </button>
          <button type="button" className="rich-toolbar__button" onClick={() => applyBlockType("quote")}>
            Quote
          </button>

          <button type="button" className="rich-toolbar__button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
            B
          </button>
          <button type="button" className="rich-toolbar__button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
            I
          </button>
          <button
            type="button"
            className="rich-toolbar__button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
          >
            U
          </button>

          <button
            type="button"
            className="rich-toolbar__button"
            onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          >
            UL
          </button>
          <button
            type="button"
            className="rich-toolbar__button"
            onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          >
            OL
          </button>
          <button type="button" className="rich-toolbar__button" onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}>
            List Off
          </button>

          <button type="button" className="rich-toolbar__button" onClick={insertLink}>
            Link
          </button>
          <button
            type="button"
            className="rich-toolbar__button"
            onClick={() =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3", includeHeaders: true })
            }
          >
            Table
          </button>
        </div>
      </div>
      {isMediaDialogOpen ? (
        <MediaPickerDialog
          items={mediaItems}
          onClose={() => setIsMediaDialogOpen(false)}
          onPick={insertImage}
          onAddFiles={onAddMediaFiles}
        />
      ) : null}
    </>
  );
}

type SyncHtmlValueProps = {
  value: string;
  lastAppliedHtmlRef: MutableRefObject<string>;
};

function SyncHtmlValue({ value, lastAppliedHtmlRef }: SyncHtmlValueProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const nextHtml = value || "";
    if (nextHtml === lastAppliedHtmlRef.current) {
      return;
    }

    applyHtmlToEditor(editor, nextHtml);
    lastAppliedHtmlRef.current = nextHtml;
  }, [editor, value, lastAppliedHtmlRef]);

  return null;
}

function applyHtmlToEditor(editor: LexicalEditor, html: string) {
  editor.update(() => {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, documentNode);
    const root = $getRoot();
    root.clear();
    if (nodes.length === 0) {
      root.append($createParagraphNode());
      return;
    }
    root.append(...nodes);
  });
}

function MediaPickerDialog({
  items,
  onClose,
  onPick,
  onAddFiles,
}: {
  items: Array<{ id: string; name: string; dataUrl: string; altText?: string }>;
  onClose: () => void;
  onPick: (image: { id: string; name: string; dataUrl: string; altText?: string }) => void;
  onAddFiles?: (files: File[]) => Promise<void>;
}) {
  const dialogContent = (
    <div className="image-dialog__backdrop" role="presentation" onClick={onClose}>
      <div className="image-dialog image-dialog--large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="image-dialog__header">
          <h3>Media Manager</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>
        {onAddFiles ? (
          <label className="ghost-button" style={{ width: "fit-content" }}>
            Upload media
            <input
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = event.target.files ? Array.from(event.target.files) : [];
                if (files.length > 0) {
                  void onAddFiles(files);
                }
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
        <div className="image-grid image-grid--dialog">
          {items.map((image) => (
            <button key={image.id} type="button" className="image-grid__thumb-button" onClick={() => onPick(image)}>
              <img src={image.dataUrl} alt={image.name} className="image-card__preview" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return dialogContent;
  }

  return createPortal(dialogContent, document.body);
}
