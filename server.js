
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

app.post("/enviar-notificacao", async (req, res) => {
  const { nome, data, hora, token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token ausente" });
  }

  const message = {
    notification: {
      title: "Nova consulta agendada",
      body: `${nome} marcou uma consulta para ${data} às ${hora}.`
    },
    token: token
  };

 

  try {
    console.log("🔔 Enviando notificação para token:", token);
    const response = await admin.messaging().send(message);
    console.log("✅ Notificação enviada com sucesso:", response);
    res.status(200).json({ success: true, response });
  } catch (error) {
  console.error("❌ Erro ao enviar notificação:", error); // <- MELHOR log
  res.status(500).json({ success: false, error: error.message, stack: error.stack });
}
});


// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
