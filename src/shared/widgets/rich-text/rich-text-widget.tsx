import React, { useCallback, useEffect, useRef, useState } from "react";
import { WidgetProps } from "react-jsonschema-form";
import { getContentHeight, htmlToSlate, SlateEditor, slateToHtml, SlateToolbar } from "@concord-consortium/slate-editor";
import { useRefState } from "../../hooks/use-ref-state";
import "@concord-consortium/slate-editor/build/index.css";
import "./rich-text-widget.scss";

export const RichTextWidget = (props: WidgetProps) => {
  const [value, valueRef, setValue] = useRefState(htmlToSlate(props.value || ""));
  const [changeCount, setChangeCount] = useState(0);
  const editorRef = useRef<any>();
  const kExtraHeight = 30;
  const kInitialHeight = 50;
  const [height, setHeight] = useState(kInitialHeight);

  const handleLoad = () => {
    setChangeCount(count => count + 1);
  }

  const handleEditorRef = useCallback((editor: any | null) => {
    editorRef.current = editor || undefined;
    if (editor) {
      // associate label with edit field
      (editor as any).el.id = props.id;
    };
  }, [editorRef.current]);

  const handleFocus = () => {
    props.onFocus(props.id, slateToHtml(valueRef.current));
  };
  const handleChange = (editorValue: any) => {
    setValue(editorValue);
    setChangeCount(count => count + 1);
  };
  const handleBlur = () => {
    const htmlValue = slateToHtml(valueRef.current);
    // update the form on blur
    props.onChange(htmlValue);
    props.onBlur(props.id, htmlValue);
  };

  // dynamically resize editor to fit content
  useEffect(() => {
    if (editorRef.current) {
      const currentHeight: number | undefined = getContentHeight(editorRef.current);
      const desiredHeight = currentHeight ? currentHeight + kExtraHeight : kInitialHeight;
      if (desiredHeight !== height) {
        setHeight(desiredHeight);
      }
    }
  }, [editorRef.current, changeCount, value]);

  return (<>
    <SlateToolbar
      colors={{ fill: "#666666", background: "#FFFFFF"}}
      selectedColors={{ fill: "#FFFFFF", background: "#666666" }}
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
