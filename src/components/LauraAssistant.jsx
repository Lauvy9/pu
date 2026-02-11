/**
 * LauraAssistant.jsx
 * - Usa: React (useState, useEffect, useRef)
 * - Detecta intenciones y entidades por reglas/regex (sin modelos externos)
 * - Integra con `lauraEngine` y `lauraMemory` para lógica y estado de sesión
 * - Lee datos reales desde `StoreContext` (products, sales, fiados)
 *
 * Justificación: un chatbot basado en reglas + memoria es ligero, determinista
 * y suficiente para consultas de stock/ventas/clientes en esta app.
 */
import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../context/StoreContext";
import lauraEngine from "../chatbot/lauraEngine";
import lauraMemory from "../chatbot/lauraMemory";
import avatar from "./LauraAssistantAvatar.gif";
import "./LauraAssistant.css";

/* -------------------------
   DETECCIÓN DE INTENCIONES
--------------------------*/
function detectIntentAndEntities(text = "") {
  const t = text.toString().trim();
  const lower = t.toLowerCase();

  let intent = "UNKNOWN";
  if (!t) intent = "EMPTY";
  else if (/\b(hola|buenas|buen dia|buen día|hey|qué tal)\b/.test(lower)) intent = "GREETING";
  else if (/\b(stock|inventario|reponer|faltantes|existencias)\b/.test(lower)) intent = "CHECK_STOCK";
  else if (/\b(ventas de hoy|ventas hoy|qué vendimos|vendimos hoy|resumen de hoy|total hoy|ingresos hoy)\b/.test(lower)) intent = "CHECK_SALES_TODAY";
  else if (/\b(cliente|clientes|quién compró|quien compr[oó]|cliente más|fiado|deuda|debe)\b/.test(lower)) intent = "CHECK_CLIENTS";
  else if (/\b(precio de|precio del|producto|productos|dame el producto|buscar|busco)\b/.test(lower) || t.split(" ").length <= 3) intent = "PRODUCT_INTEREST";
  else if (/\b(cómo|como|ayuda|explic[aá]|qué hago|me explic[aó])\b/.test(lower)) intent = "HELP";

  // Entidades: nombre
  let name = null;
  const nameMatch = t.match(/(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{1,40})/i);
  if (nameMatch) name = nameMatch[1].trim();

  // Entidad: posible producto / categoría
  let product = null;
  const prodMatch = t.match(/(?:precio de|precio del|producto|busco|buscar|dame el|dame la)\s+([a-z0-9áéíóúñ\s\-]{2,60})/i);
  if (prodMatch) product = prodMatch[1].trim();

  return { intent, entities: { name, product } };
}

/* -------------------------
   COMPONENTE PRINCIPAL
--------------------------*/
export default function LauraAssistant({ usuario = null }) {
  const { sales = [], products = [], fiados = [] } = useStore() || {};

  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("laura_history") || "[]");
    } catch (e) {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);

  const sessionIdRef = useRef(null);
  if (!sessionIdRef.current)
    sessionIdRef.current = lauraMemory.createSession();
  const sessionId = sessionIdRef.current;

  /* Guardar historial */
  useEffect(() => {
    sessionStorage.setItem("laura_history", JSON.stringify(history));
  }, [history]);

  /* Scroll */
  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history, open]);

  /* Saludo inicial */
  useEffect(() => {
    if (!usuario) return;

    const name =
      usuario?.displayName || usuario?.nombre || usuario?.email || "Usuario";

    try {
      lauraMemory.remember(sessionId, "userName", name);
    } catch (e) {}

    const greetedKey = `laura_greeted_${sessionId}`;
    if (!sessionStorage.getItem(greetedKey)) {
      setHistory((h) => [
        ...h,
        {
          from: "bot",
          text: `¡Hola ${name}! Soy Laura, tu asistente. Pregúntame por stock, ventas o clientes.`,
        },
      ]);
      sessionStorage.setItem(greetedKey, "1");
    }
  }, [usuario, sessionId]);

  /* Preprocesado (regex + memoria) */
  const handlePreprocess = (text) => {
    const detected = detectIntentAndEntities(text);

    if (detected.entities?.name) {
      lauraMemory.remember(sessionId, "userName", detected.entities.name);
      setHistory((h) => [
        ...h,
        {
          from: "bot",
          text: `Perfecto, te recordé como ${detected.entities.name}.`,
        },
      ]);
    }

    if (detected.entities?.product) {
      lauraMemory.remember(sessionId, "lastProduct", detected.entities.product);
      setHistory((h) => [
        ...h,
        {
          from: "bot",
          text: `Anoté que te interesa: ${detected.entities.product}.`,
        },
      ]);
    }
  };

  /* Enviar mensaje */
  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setHistory((h) => [...h, { from: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      handlePreprocess(text);
    } catch (e) {
      console.warn("preprocess failed", e);
    }

    try {
      const result = await lauraEngine.processQuery({
        text,
        storeContext: { sales, products, fiados },
        sessionId,
      });

      // Normalize response text safely
      let botText = "Lo siento, no pude procesar eso.";
      if (result) {
        if (typeof result === "string") botText = result;
        else if (typeof result.text === "string") botText = result.text;
        else if (result.response && typeof result.response === "string") botText = result.response;
        else if (result.response && typeof result.response.text === "string") botText = result.response.text;
      }

      setHistory((h) => [...h, { from: "bot", text: botText }]);
    } catch (err) {
      console.error("LauraAssistant error:", err);
      setHistory((h) => [
        ...h,
        { from: "bot", text: "Ocurrió un error procesando tu solicitud." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="laura-fab-root">
      <button className="laura-fab" onClick={() => setOpen((o) => !o)}>
        <img src={avatar} alt="Laura avatar" className="laura-fab-avatar" />
      </button>

      <div className={`laura-panel ${open ? "visible" : ""}`}>
        <div className="laura-panel-header">
          <img src={avatar} className="laura-panel-avatar" />
          <div className="laura-title-block">
            <div className="laura-name">Laura</div>
            <div className="laura-tag">Asistente de ventas</div>
          </div>
          <button className="laura-close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="laura-panel-body" ref={bodyRef}>
          {history.map((m, i) => (
            <div key={i} className={`laura-bubble ${m.from}`}>
              <span>{m.text}</span>
            </div>
          ))}
          {typing && <div className="laura-typing">Laura está escribiendo…</div>}
        </div>

        <div className="laura-panel-footer">
          <input
            className="laura-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Preguntá por stock, ventas, clientes…"
          />
          <button className="laura-send" onClick={send}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
