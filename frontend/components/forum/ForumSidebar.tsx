"use client";

import { useEffect, useState } from "react";
import { C, SANS } from "@/lib/constants";
import {
  apiListAttachments,
  attachmentUrl,
  isImageAttachment,
  type AttachmentInfo,
  type ForumDetail,
} from "@/lib/chat";
import Avatar from "./Avatar";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.muted,
        margin: "18px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

export default function ForumSidebar({
  token,
  forum,
  onlineIds,
  refreshKey,
}: {
  token: string;
  forum: ForumDetail;
  onlineIds: Set<number>;
  refreshKey?: number;
}) {
  const [resources, setResources] = useState<AttachmentInfo[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiListAttachments(token, forum.id).then((list) => {
      if (!cancelled) setResources(list);
    });
    return () => {
      cancelled = true;
    };
  }, [token, forum.id, refreshKey]);

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "16px 18px 32px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.012)",
        ...SANS,
      }}
    >
      <SectionLabel>Forum</SectionLabel>
      <p style={{ color: C.cream, fontSize: "0.95rem", fontWeight: 600 }}>{forum.name}</p>
      {forum.domain && (
        <span
          style={{
            display: "inline-block",
            marginTop: 6,
            fontSize: "0.6rem",
            color: C.orange,
            border: "1px solid rgba(255,91,46,0.25)",
            padding: "1px 7px",
            letterSpacing: "0.06em",
          }}
        >
          {forum.domain}
        </span>
      )}

      {forum.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p style={{ color: "rgba(245,242,235,0.6)", fontSize: "0.78rem", lineHeight: 1.5 }}>
            {forum.description}
          </p>
        </>
      )}

      <SectionLabel>Members — {forum.member_count}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {forum.members.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <Avatar name={m.full_name} userId={m.id} size={30} online={onlineIds.has(m.id)} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: C.cream,
                  fontSize: "0.8rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.full_name}
              </p>
              {m.role === "creator" && (
                <span style={{ color: C.orange, fontSize: "0.6rem", letterSpacing: "0.06em" }}>
                  CREATOR
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Shared Resources — {resources.length}</SectionLabel>
      {resources.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "16px 12px",
            textAlign: "center",
            color: C.muted,
            fontSize: "0.72rem",
          }}
        >
          Files shared in this forum will appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resources.map((a) => (
            <a
              key={a.id}
              href={attachmentUrl(a.url)}
              target="_blank"
              rel="noopener noreferrer"
              download={isImageAttachment(a) ? undefined : a.filename}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 8px",
                borderRadius: 8,
                textDecoration: "none",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {isImageAttachment(a) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl(a.url)}
                  alt={a.filename}
                  style={{ width: 32, height: 32, borderRadius: 5, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <span style={{ fontSize: "1.1rem", width: 32, textAlign: "center", flexShrink: 0 }}>📄</span>
              )}
              <span
                style={{
                  color: C.cream,
                  fontSize: "0.74rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.filename}
              </span>
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
