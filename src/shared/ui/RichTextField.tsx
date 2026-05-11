import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
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
import { $getRoot, type LexicalEditor } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

const DEFAULT_MIN_HEIGHT = 120;
const PLACEHOLDER_MIN_HEIGHT = 1;

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
}: RichTextFieldProps) {
  const lastAppliedHtmlRef = useRef(value || "");
  const helperId = id ? `${id}-helper` : undefined;
  const issuesId = id ? `${id}-issues` : undefined;
  const describedBy = [helperText ? helperId : undefined, issues.length > 0 ? issuesId : undefined]
    .filter(Boolean)
    .join(" ");
  const editorNamespace = useMemo(
    () => `seo-rich-text-${(id || label).replace(/\s+/g, "-").toLowerCase()}`,
    [id, label],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: editorNamespace,
      onError: (error: Error) => {
        throw error;
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, TableNode, TableRowNode, TableCellNode],
      editorState: (editor: LexicalEditor) => {
        applyHtmlToEditor(editor, value || "");
      },
    }),
    [editorNamespace, value],
  );

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id={id}
              className={tone === "attention" ? "rich-editor rich-editor--attention" : "rich-editor"}
              style={{ minHeight: Math.max(minHeight, PLACEHOLDER_MIN_HEIGHT) }}
              aria-invalid={issues.length > 0}
              aria-describedby={describedBy || undefined}
            />
          }
          placeholder={placeholder ? <span className="rich-editor__placeholder">{placeholder}</span> : null}
          ErrorBoundary={LexicalErrorBoundary}
        />
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
    </label>
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
    root.append(...nodes);
  });
}
