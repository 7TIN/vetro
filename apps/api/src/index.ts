import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple MERN monorepo backend is alive! 🚀',
    time: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
    res.json({
        message : "hello"
    })
})

app.listen(PORT, () => {
  console.log(`API → http://localhost:${PORT}`);
});