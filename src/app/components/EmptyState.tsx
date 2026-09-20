export default function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div style={{ marginTop: 16, border: "2px solid var(--ink)", borderRadius: 18, padding: 16, background: "#fff" }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.6, fontWeight: 600 }}>{detail}</div>
    </div>
  );
}