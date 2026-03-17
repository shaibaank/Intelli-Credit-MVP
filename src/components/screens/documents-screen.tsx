"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

const statusClass: Record<DocumentItem["status"], string> = {
  pending: "bg-gray-200",
  uploading: "bg-blue-300",
  ready: "bg-green-300",
  partial: "bg-yellow-300",
};

const statusText: Record<DocumentItem["status"], string> = {
  pending: "Pending",
  uploading: "Uploading...",
  ready: "Ready",
  partial: "Partial",
};

const typeLabel: Record<string, string> = {
  annual_reports: "Annual Report",
  alm_statement: "ALM Statement",
  shareholding: "Shareholding Pattern",
  borrowing_profile: "Borrowing Profile",
  portfolio_performance: "Portfolio Performance",
};

export function DocumentsScreen({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const refresh = useCallback(async () => {
    const payload = await api.getDocuments(caseId);
    setDocs(payload);
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canProceed = useMemo(() => docs.length > 0 && docs.every((d) => !d.required || d.status === "ready" || d.status === "partial"), [docs]);

  function normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function detectCodeFromFilename(filename: string): string | null {
    const token = normalize(filename);
    const aliases: Array<{ code: string; keys: string[] }> = [
      { code: "annual_reports", keys: ["annualreport", "annualreports", "ar", "fy24"] },
      { code: "alm_statement", keys: ["alm", "assetliability", "almstatement"] },
      { code: "shareholding", keys: ["shareholding", "shareholder", "captable"] },
      { code: "borrowing_profile", keys: ["borrowing", "borrowings", "debtprofile"] },
      { code: "portfolio_performance", keys: ["portfolio", "performance", "collection", "par"] },
    ];

    for (const entry of aliases) {
      if (entry.keys.some((key) => token.includes(key))) {
        return entry.code;
      }
    }
    return null;
  }

  async function ingestFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    setIsUploading(true);
    let fallbackIndex = 0;

    for (const file of incoming) {
      const detectedCode = detectCodeFromFilename(file.name);
      const targetDoc =
        docs.find((doc) => doc.code === detectedCode) ??
        docs.filter((doc) => doc.required && doc.status !== "ready" && doc.status !== "partial")[fallbackIndex++] ??
        docs[0];

      if (!targetDoc) {
        setLog((prev) => [`Skipped ${file.name}: no document bucket available.`, ...prev]);
        continue;
      }

      setLog((prev) => [`Uploading ${file.name} -> ${targetDoc.label}`, ...prev]);
      await api.updateDocument(caseId, {
        code: targetDoc.code,
        status: "ready",
        filename: file.name,
        detected_type: typeLabel[targetDoc.code] ?? targetDoc.label,
        confidence: 0.93,
      });
      setLog((prev) => [`OK ${file.name} classified as ${typeLabel[targetDoc.code] ?? targetDoc.label}`, ...prev]);
    }

    await refresh();
    setIsUploading(false);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    await ingestFiles(event.dataTransfer.files);
  }

  async function markReady(doc: DocumentItem) {
    setLog((prev) => [`Uploading ${doc.label}...`, ...prev]);
    await api.updateDocument(caseId, {
      code: doc.code,
      status: "ready",
      filename: `${doc.code}-fy24.pdf`,
      detected_type: `${typeLabel[doc.code]} - FY24`,
      confidence: 0.96,
    });
    await refresh();
    setLog((prev) => [`OK ${doc.code}-fy24.pdf classified as '${typeLabel[doc.code]}' (96% confidence)`, ...prev]);
  }

  async function completeAll() {
    for (const doc of docs) {
      await api.updateDocument(caseId, {
        code: doc.code,
        status: "ready",
        filename: `${doc.code}-fy24.pdf`,
        detected_type: `${typeLabel[doc.code]} - FY24`,
        confidence: 0.95,
      });
    }
    await refresh();
    setLog((prev) => ["OK all mandatory documents uploaded and classified.", ...prev]);
  }

  async function markPartial(doc: DocumentItem) {
    await api.updateDocument(caseId, {
      code: doc.code,
      status: "partial",
      review_note: "Marked not available by analyst",
    });
    await refresh();
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
      <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
        <h2 className="mb-3 text-2xl font-bold">Required Documents (5)</h2>
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.code} className="border-2 border-[#2d2d2d] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold">{doc.label}</div>
                  <Link href={doc.sample_url ?? "#"} target="_blank" className="text-xs underline">View sample</Link>
                </div>
                <span className={`border-2 border-[#2d2d2d] px-2 py-1 text-xs ${statusClass[doc.status]}`}>{statusText[doc.status]}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => void markReady(doc)} className="border-2 border-[#2d2d2d] bg-[#2d5da1] px-2 py-1 text-xs text-white">Upload Demo File</button>
                <button onClick={() => void markPartial(doc)} className="border-2 border-[#2d2d2d] bg-[#fff9c4] px-2 py-1 text-xs">Mark N/A</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(event) => void onDrop(event)}
          className={`border-[3px] border-dashed p-8 text-center transition-colors ${isDragging ? "border-[#2d5da1] bg-[#dbe9ff]" : "border-[#2d2d2d] bg-white"}`}
        >
          <div className="text-2xl font-bold">Drop files here or click to browse</div>
          <div className="mt-2 text-sm">Attach PDFs or Excels. We will auto-classify them into the right buckets.</div>
          <label className="mt-4 inline-block cursor-pointer border-2 border-[#2d2d2d] bg-[#fff9c4] px-3 py-2 text-sm font-bold">
            {isUploading ? "Uploading..." : "Choose Files"}
            <input
              type="file"
              multiple
              className="hidden"
              disabled={isUploading}
              onChange={(event) => {
                if (!event.target.files) return;
                void ingestFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <div className="space-y-2">
          {docs.filter((d) => d.filename).map((doc) => (
            <div key={doc.code} className="border-2 border-[#2d2d2d] bg-white p-3">
              <div className="font-bold">{doc.filename}</div>
              <div className="text-sm">Detected: {doc.detected_type} - {Math.round((doc.confidence ?? 0) * 100)}%</div>
              <div className="mt-2 h-2 border border-[#2d2d2d]">
                <div className="h-full w-full bg-green-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-2 border-[#2d2d2d] bg-[#fdfbf7] p-3 text-sm">
          <div className="font-bold">Ingestion Log</div>
          {log.length === 0 ? <div>No events yet.</div> : log.slice(0, 5).map((line) => <div key={line}>{line}</div>)}
        </div>

        <button
          disabled={!canProceed}
          onClick={() => router.push(`/case/${caseId}/extraction`)}
          className="w-full border-[3px] border-[#2d2d2d] bg-[#2d5da1] px-4 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Proceed to Extraction
        </button>
        <button onClick={() => void completeAll()} className="w-full border-[3px] border-[#2d2d2d] bg-[#fff9c4] px-4 py-3">
          Auto-complete all docs (Demo)
        </button>
      </div>
    </section>
  );
}
