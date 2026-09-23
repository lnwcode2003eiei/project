import { useEffect, useRef, useState } from "react";

export default function ImageFileInput({ onChange, className, selectedFiles, ref: forwardedRef, ...props }) {
  const inputRef = useRef(null);
  const [selection, setSelection] = useState([]);
  const urls = useRef([]);
  useEffect(() => {
    if (selectedFiles === undefined) return;
    if (!selectedFiles || (Array.isArray(selectedFiles) && !selectedFiles.length)) {
      if (inputRef.current) inputRef.current.value = "";
      urls.current.forEach(URL.revokeObjectURL);
      urls.current = [];
    }
  }, [selectedFiles]);
  const visibleSelection = selectedFiles && (!Array.isArray(selectedFiles) || selectedFiles.length) ? selection : [];
  useEffect(() => {
    const clear = () => { urls.current.forEach(URL.revokeObjectURL); urls.current = []; setSelection([]); };
    const form = inputRef.current?.form;
    form?.addEventListener("reset", clear);
    return () => { form?.removeEventListener("reset", clear); urls.current.forEach(URL.revokeObjectURL); };
  }, []);
  return <span className="my-2 block rounded-xl border border-gray-200 bg-white p-3 font-normal text-gray-700" data-original-class={className}>
    <span className="relative flex min-h-12 flex-wrap items-center gap-3 rounded-lg focus-within:ring-2 focus-within:ring-[#701D10]">
      <span className="rounded-lg bg-[#701D10] px-4 py-3 text-sm font-semibold text-white">เลือกรูปภาพ</span>
      <span className="min-w-0 break-all text-sm">{visibleSelection.length ? visibleSelection.map(file => file.name).join(", ") : "เลือกรูปภาพเพื่อแสดง"}</span>
      <input {...props} ref={element => { inputRef.current = element; if (typeof forwardedRef === "function") forwardedRef(element); else if (forwardedRef) forwardedRef.current = element; }} type="file" aria-label="เลือกรูปภาพเพื่อแสดง" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" onChange={event => {
        onChange?.(event);
        urls.current.forEach(URL.revokeObjectURL);
        const selected = Array.from(event.target.files || []).map(file => ({ name: file.name, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" }));
        urls.current = selected.map(file => file.url).filter(Boolean);
        setSelection(selected);
      }} />
    </span>
    {!!visibleSelection.length && <span className="mt-3 flex flex-wrap gap-3">{visibleSelection.filter(item => item.url).map(item => <img key={item.url} src={item.url} alt={`ตัวอย่าง ${item.name}`} className="h-28 w-36 rounded-lg border object-contain" />)}</span>}
  </span>;
}
