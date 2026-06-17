import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("[DB] Conexión a PostgreSQL establecida");

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Hexa Core API corriendo en http://localhost:${PORT}`);
      console.log(`[SERVER] Entorno: ${process.env.NODE_ENV ?? "development"}`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`[SERVER] Señal ${signal} recibida. Cerrando...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("[DB] Conexión cerrada");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("[SERVER] Error fatal en bootstrap:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
