import React, { useCallback, useEffect, useRef, useState } from "react";
import { WidgetProps } from "react-jsonschema-form";
import { getContentHeight, htmlToSlate, SlateEditor, slateToHtml, SlateToolbar } from "@concord-consortium/slate-editor";
import { useRefState } from "../../hooks/use-ref-state";
import "@concord-consortium/slate-editor/build/index.css";
import "./rich-text-widget.global.scss";

const kThemeColor = "#34a5be";

export const RichTextWidget = (props: WidgetProps) => {
  const { id, onFocus, onChange, onBlur } = props;
  const [value, valueRef, setValue] = useRefState(htmlToSlate(props.value || ""));
  const [changeCount, setChangeCount] = useState(0);
  const editorRef = useRef<any>();
  const kExtraHeight = 30;
  const kInitialHeight = 50;
  const [height, setHeight] = useState(kInitialHeight);

  const handleLoad = useCallback(() => {
    setChangeCount(count => count + 1);
  }, []);

  const handleEditorRef = useCallback((editor: any | null) => {
    editorRef.current = editor || undefined;
    if (editor) {
      // associate label with edit field
      (editor as any).el.id = id;
    }
  }, [id]);

  const handleFocus = useCallback(() => {
    onFocus(id, slateToHtml(valueRef.current));
  }, [id, onFocus, valueRef]);

  const handleChange = useCallback((editorValue: any) => {
    setValue(editorValue);
    setChangeCount(count => count + 1);
    onChange(slateToHtml(editorValue));
  }, [onChange, setValue]);

  const handleBlur = useCallback(() => {
    onBlur(id, slateToHtml(valueRef.current));
  }, [id, onBlur, valueRef]);

  // dynamically resize editor to fit content
  useEffect(() => {
    if (editorRef.current) {
      const currentHeight: number | undefined = getContentHeight(editorRef.current);
      const desiredHeight = currentHeight ? currentHeight + kExtraHeight : kInitialHeight;
      if (desiredHeight !== height) {
        setHeight(desiredHeight);
      }
    }
  }, [changeCount, value, height]);

  return (<>
    <SlateToolbar
      colors={{
        buttonColors: { fill: "#666666", background: "#FFFFFF" },
        selectedColors: { fill: "#FFFFFF", background: "#666666" },
        themeColor: kThemeColor }}
      order={["bold", "italic", "underlined", "deleted", "superscript", "subscript", "color",
              "image", "link",
              "heading1", "heading2", "heading3", "block-quote", "ordered-list", "bulleted-list"]}
      padding={2}
      editor={editorRef.current}
      changeCount={changeCount}
      />
    <div className="form-control" style={{ height }}>
      <SlateEditor
        className={`custom-rich-text-widget`}
        value={value}
        onEditorRef={handleEditorRef}
        onLoad={handleLoad}
        onFocus={handleFocus}
        onValueChange={handleChange}
        onBlur={handleBlur} />
    </div>
  </>);
};
