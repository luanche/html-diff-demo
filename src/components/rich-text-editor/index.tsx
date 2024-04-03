import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export interface RichTextProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextProps> = ({
  value,
  onChange,
}) => {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
        toolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "decreaseIndent",
          "increaseIndent",
          "undo",
          "redo",
        ],
        link: {
          decorators: {
            targetBlank: {
              mode: "automatic",
              callback: () => true,
              attributes: {
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          },
        },
      }}
      data={value}
      onChange={(_: any, editor: { getData: () => any }) => {
        onChange(editor.getData());
      }}
    />
  );
};
