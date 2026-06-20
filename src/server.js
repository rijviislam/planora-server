require("dotenv").config();
const app = require("./app");
const { prisma } = require("./config/db");

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");

    app.listen(PORT, () => {
      console.log(`Planora server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
