import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { initProviders } from "./ai-provider";

// Initialize AI providers from environment variables
initProviders();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
