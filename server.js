
import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getDatabase } from "firebase-admin/database";
import cors from "cors";


dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*", // ou coloque apenas "https://siteconsultorio.netlify.app" se quiser restringir
}));

const raw = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// ⚠️ CONVERTE \\n para \n reais (corrige erro do PEM)
raw.private_key = raw.private_key.replace(/\\n/g, '\n');
admin.initializeApp({
  credential: admin.credential.cert(raw),
  databaseURL: "https://admin-consultorio-default-rtdb.firebaseio.com"
});



const db = getDatabase();

// Rota de notificação automática
app.post("/enviar-notificacao", async (req, res) => {
  const { uid, nome, data, hora } = req.body;

  try {
    // Busca o token salvo no Firebase
    const tokenSnapshot = await db.ref(`usuarios/${uid}/token`).once("value");
    const token = tokenSnapshot.val();

    if (!token) {
      return res.status(404).send({ success: false, message: "Token não encontrado." });
    }

    const message = {
      notification: {
        title: "Nova consulta agendada",
        body: `${nome} marcou uma consulta para ${data} às ${hora}.`
      },
      token: token
    };

    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });

  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);
    res.status(500).send({ success: false, error });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

