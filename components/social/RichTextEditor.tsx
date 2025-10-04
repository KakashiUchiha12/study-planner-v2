"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
};

// Temporarily disable react-quill to avoid React 18 findDOMNode issues
const QuillNoSSR: any = null;
import "react-quill/dist/quill.snow.css";

export function RichTextEditor({ value, onChange, placeholder, minHeight = 80 }: Props) {
  const [ready, setReady] = useState<boolean>(false);
  useEffect(() => { setReady(true); }, []);
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  }), []);
  const formats = [
    "header",
    "bold", "italic", "underline", "strike",
    "list", "bullet",
    "link",
  ];
  if (!ready || !QuillNoSSR) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none border rounded-md bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="quill-wrapper" style={{ minHeight }}>
      <QuillNoSSR theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
    </div>
  );
}


