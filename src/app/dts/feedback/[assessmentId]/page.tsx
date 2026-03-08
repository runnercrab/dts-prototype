"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Q1 = "yes" | "almost" | "no" | null;
type Q3 = "yes" | "no" | "depends" | null;

export default function FeedbackPage() {
  const params = useParams();
  const assessmentId = params?.assessmentId as string;

  const [q1, setQ1] = useState<Q1>(null);
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState<Q3>(null);
  const [q3Why, setQ3Why] = useState("");
  const [q4, setQ4] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = q1 !== null && q3 !== null;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/dts/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          q1_reflects: q1,
          q2_missing: q2,
          q3_would_pay: q3,
          q3_depends_why: q3Why,
          q4_referral: q4,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setDone(true);
    } catch {
      setError("Ha habido un problema. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.checkCircle}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M7 16.5L13 22.5L25 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={styles.doneTitle}>Gracias, {"\u00fa"}til de verdad.</h1>
          <p style={styles.doneText}>
            Tu feedback llega directo al equipo de Gapply. Lo usaremos para mejorar la plataforma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>
          <span style={styles.logoBlue}>G</span>apply
        </span>
      </div>

      <div style={styles.container}>
        <div style={styles.intro}>
          <p style={styles.tag}>Tu opini{"\u00f3"}n</p>
          <h1 style={styles.title}>
            {"\u00bf"}El plan de acci{"\u00f3"}n te es {"\u00fa"}til?
          </h1>
          <p style={styles.subtitle}>
            4 preguntas. Menos de 2 minutos. Sin trampa.
          </p>
        </div>

        {/* Q1 */}
        <div style={styles.question}>
          <p style={styles.qLabel}>
            <span style={styles.qNumber}>01</span>
            {"\u00bf"}El plan de acci{"\u00f3"}n refleja los problemas reales de tu empresa?
          </p>
          <div style={styles.optionRow}>
            {([
              { value: "yes", label: "S\u00ed, es muy preciso" },
              { value: "almost", label: "Casi, pero falta algo" },
              { value: "no", label: "No del todo" },
            ] as { value: Q1; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.optionBtn,
                  ...(q1 === opt.value ? styles.optionBtnActive : {}),
                }}
                onClick={() => setQ1(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div style={styles.question}>
          <p style={styles.qLabel}>
            <span style={styles.qNumber}>02</span>
            {"\u00bf"}Hay algo importante que falta y no aparece en el plan?
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Si algo no encaja o ech\u00e1s en falta algo, cu\u00e9ntanos aqu\u00ed."
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            rows={3}
          />
        </div>

        {/* Q3 */}
        <div style={styles.question}>
          <p style={styles.qLabel}>
            <span style={styles.qNumber}>03</span>
            {"\u00bf"}Pagar\u00edas por tener esto para tu empresa?
          </p>
          <div style={styles.optionRow}>
            {([
              { value: "yes", label: "S\u00ed" },
              { value: "no", label: "No" },
              { value: "depends", label: "Depende" },
            ] as { value: Q3; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.optionBtn,
                  ...(q3 === opt.value ? styles.optionBtnActive : {}),
                }}
                onClick={() => setQ3(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {q3 === "depends" && (
            <textarea
              style={{ ...styles.textarea, marginTop: 12 }}
              placeholder="\u00bfDe qu\u00e9 depender\u00eda?"
              value={q3Why}
              onChange={(e) => setQ3Why(e.target.value)}
              rows={2}
            />
          )}
        </div>

        {/* Q4 */}
        <div style={styles.question}>
          <p style={styles.qLabel}>
            <span style={styles.qNumber}>04</span>
            {"\u00bf"}Conoces a alg\u00fan CEO que est\u00e9 pasando por algo parecido a lo que sali\u00f3 en tu diagn\u00f3stico?
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Si te viene alguien a la cabeza, pon su nombre aqu\u00ed. No hace falta m\u00e1s."
            value={q4}
            onChange={(e) => setQ4(e.target.value)}
            rows={2}
          />
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button
          style={{
            ...styles.submitBtn,
            ...(!canSubmit || submitting ? styles.submitBtnDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Enviando..." : "Enviar feedback"}
        </button>

        <p style={styles.hint}>
          Las preguntas 1 y 3 son obligatorias.
        </p>
      </div>
    </div>
  );
}

const BLUE = "#1a90ff";
const DARK = "#0f172a";
const MID = "#64748b";
const BORDER = "#dde3eb";
const BG = "#f7f9fb";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    padding: "20px 32px",
    borderBottom: `1.5px solid ${BORDER}`,
    background: "white",
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: DARK,
    letterSpacing: "-0.5px",
  },
  logoBlue: {
    color: BLUE,
  },
  container: {
    maxWidth: 620,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  intro: {
    marginBottom: 48,
  },
  tag: {
    fontSize: 13,
    fontWeight: 600,
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: DARK,
    lineHeight: 1.2,
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 16,
    color: MID,
    lineHeight: 1.6,
  },
  question: {
    marginBottom: 40,
    paddingBottom: 40,
    borderBottom: `1.5px solid ${BORDER}`,
  },
  qLabel: {
    fontSize: 17,
    fontWeight: 600,
    color: DARK,
    lineHeight: 1.5,
    marginBottom: 20,
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  qNumber: {
    fontSize: 13,
    fontWeight: 700,
    color: BLUE,
    background: "#e8f4ff",
    borderRadius: 6,
    padding: "3px 8px",
    minWidth: 32,
    textAlign: "center" as const,
    marginTop: 2,
    flexShrink: 0,
  },
  optionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  optionBtn: {
    padding: "12px 20px",
    borderRadius: 12,
    border: `1.5px solid ${BORDER}`,
    background: "white",
    fontSize: 15,
    fontWeight: 500,
    color: DARK,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  optionBtnActive: {
    background: BLUE,
    borderColor: BLUE,
    color: "white",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: `1.5px solid ${BORDER}`,
    background: "white",
    fontSize: 15,
    color: DARK,
    fontFamily: "'DM Sans', sans-serif",
    resize: "vertical" as const,
    lineHeight: 1.6,
    boxSizing: "border-box" as const,
    outline: "none",
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: BLUE,
    color: "white",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.3px",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  hint: {
    fontSize: 13,
    color: MID,
    textAlign: "center" as const,
    marginTop: 14,
  },
  errorMsg: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: BLUE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  card: {
    maxWidth: 480,
    margin: "120px auto 0",
    background: "white",
    borderRadius: 20,
    border: `1.5px solid ${BORDER}`,
    padding: "52px 40px",
    textAlign: "center" as const,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: DARK,
    marginBottom: 16,
    letterSpacing: "-0.5px",
  },
  doneText: {
    fontSize: 16,
    color: MID,
    lineHeight: 1.6,
  },
};