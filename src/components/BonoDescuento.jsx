import { useState } from "react";
import "./BonoDescuento.css";

export default function BonoDescuento() {
  const [codigo, setCodigo] = useState("");
  const [documento, setDocumento] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState(null); // success | error
  const [loading, setLoading] = useState(false);

  const [bonoId, setBonoId] = useState(null);
  const [puedeCanjear, setPuedeCanjear] = useState(false);

  // ==========================
  // CONSULTAR ESTADO Y EXISTENCIA
  // ==========================
  const consultarEstado = async () => {
    if (!codigo || !documento) {
      setEstado("error");
      setMensaje("Ingresa código y documento");
      return;
    }

    setLoading(true);
    setMensaje("");
    setEstado(null);
    setPuedeCanjear(false);
    setBonoId(null);

    try {
      // 1️⃣ VALIDAR QUE EL CÓDIGO EXISTA
      const existeRes = await fetch(
        `https://macfer.crepesywaffles.com/api/bono-descuentos?filters[codigo][$eq]=${codigo}`
      );
      const existeJson = await existeRes.json();

      if (existeJson.data.length === 0) {
        setEstado("error");
        setMensaje("❌ El código del bono no existe");
        return;
      }

      // 2️⃣ BUSCAR POR CÓDIGO + DOCUMENTO
      const res = await fetch(
        `https://macfer.crepesywaffles.com/api/bono-descuentos?filters[codigo][$eq]=${codigo}&filters[documento][$eq]=${documento}`
      );
      const json = await res.json();

      // NO existe registro para este documento → se podrá crear
      if (json.data.length === 0) {
        setEstado("success");
        setMensaje("✅ Código válido, puedes canjearlo");
        setPuedeCanjear(true);
        return;
      }

      // EXISTE → usar PUT
      const bono = json.data[0];
      setBonoId(bono.id);

      if (bono.attributes.canjeado) {
        setEstado("error");
        setMensaje("❌ Este bono ya fue canjeado por este documento");
        return;
      }

      setEstado("success");
      setMensaje("✅ Bono encontrado, listo para canjear");
      setPuedeCanjear(true);
    } catch {
      setEstado("error");
      setMensaje("Error consultando el bono");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // CANJEAR BONO
  // POST solo si NO existe
  // PUT si existe
  // ==========================
  const canjearBono = async () => {
    setLoading(true);
    setMensaje("");
    setEstado(null);

    try {
      // EXISTE → PUT
      if (bonoId) {
        await fetch(
          `https://macfer.crepesywaffles.com/api/bono-descuentos/${bonoId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: { canjeado: true },
            }),
          }
        );

        setEstado("success");
        setMensaje("🔁 Bono actualizado y canjeado");
      }
      // NO EXISTE → POST
      else {
        const res = await fetch(
          "https://macfer.crepesywaffles.com/api/bono-descuentos",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                codigo,
                descuento: 20,
                documento,
                canjeado: true,
              },
            }),
          }
        );

        const json = await res.json();
        setBonoId(json.data.id);

        setEstado("success");
        setMensaje("🆕 Bono creado y canjeado");
      }

      setPuedeCanjear(false);
    } catch {
      setEstado("error");
      setMensaje("Error al canjear el bono");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // EDITAR ESTADO (PUT)
  // ==========================
  const editarEstado = async (nuevoEstado) => {
    if (!bonoId) return;

    setLoading(true);
    setMensaje("");
    setEstado(null);

    try {
      await fetch(
        `https://macfer.crepesywaffles.com/api/bono-descuentos/${bonoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: { canjeado: nuevoEstado },
          }),
        }
      );

      setEstado("success");
      setMensaje(
        nuevoEstado
          ? "🔁 Bono marcado como CANJEADO"
          : "♻️ Bono marcado como NO canjeado"
      );
    } catch {
      setEstado("error");
      setMensaje("Error actualizando el bono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bono-container">
      <h2>Canjear bono</h2>

      <input
        className="bono-input"
        placeholder="Código (ej: feria20)"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />

      <input
        className="bono-input"
        placeholder="Documento"
        value={documento}
        onChange={(e) => setDocumento(e.target.value)}
      />

      <button
        className="btn btn-consultar"
        onClick={consultarEstado}
        disabled={loading}
      >
        Consultar estado
      </button>

      <button
        className={`btn btn-canjear ${!puedeCanjear ? "disabled" : ""}`}
        onClick={canjearBono}
        disabled={!puedeCanjear || loading}
      >
        Canjear bono
      </button>

      {bonoId && (
        <div className="admin-actions">
          <button
            className="btn btn-ok"
            onClick={() => editarEstado(true)}
          >
            Marcar como canjeado
          </button>

          <button
            className="btn btn-error"
            onClick={() => editarEstado(false)}
          >
            Marcar como NO canjeado
          </button>
        </div>
      )}

      {mensaje && (
        <p className={`mensaje ${estado === "success" ? "ok" : "error"}`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
