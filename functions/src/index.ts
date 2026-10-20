import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// La clave de Resend se guarda como secreto, no en el código.
const resendApiKey = defineSecret("RESEND_API_KEY");

// Debe ser un dominio verificado en Resend.
const REMITENTE = "CTP Acosta <avisos@tudominio.com>";

export const enviarAviso = onDocumentCreated(
  {
    document: "avisos/{avisoId}",
    secrets: [resendApiKey],
    region: "us-central1",
  },
  async (event) => {
    const aviso = event.data?.data();
    if (!aviso) return;

    const niveles: number[] = aviso.niveles ?? [];

    // Encargados registrados en el perfil de cada estudiante.
    const snap = await db
      .collection("usuarios")
      .where("encargadoCorreo", "!=", null)
      .get();

    const destinatarios = new Set<string>();
    snap.forEach((doc) => {
      const u = doc.data();
      const sinFiltroNivel = niveles.length === 0;
      const nivelCoincide = u.nivel && niveles.includes(u.nivel);
      if ((sinFiltroNivel || nivelCoincide) && u.encargadoCorreo) {
        destinatarios.add(u.encargadoCorreo);
      }
    });

    const lista = [...destinatarios];
    if (lista.length === 0) {
      console.log("Aviso sin destinatarios", event.params.avisoId);
      return;
    }

    // Resend acepta hasta 100 correos por lote.
    for (let i = 0; i < lista.length; i += 100) {
      const lote = lista.slice(i, i + 100).map((correo) => ({
        from: REMITENTE,
        to: [correo],
        subject: `Aviso: ${aviso.titulo}`,
        text: `${aviso.texto}\n\nFecha: ${aviso.fecha}\n\nCTP de Acosta`,
      }));

      const respuesta = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lote),
      });

      if (!respuesta.ok) {
        console.error("Error enviando lote", respuesta.status, await respuesta.text());
      }
    }
  }
);
