// src/server.ts
import "dotenv/config";
import sequelize, { connect } from "./config/database";
import express from 'express';
import cors from 'cors';
import routes from './routes';

if (process.env.NODE_ENV === "development") {
  console.log("ENV:", process.env);
}

const app = express();
const PORT: number = parseInt(process.env.PORT as string) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

(async () => {
  try {
    await connect();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();