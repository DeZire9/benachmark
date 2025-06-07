import express from 'express';
import { run } from './price-job.js';

const app = express();
app.use(express.json());

app.post('/run-job', async (req, res) => {
  const { userId, filePath, fileName } = req.body || {};
  if (!userId || !filePath || !fileName) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const results = await run(userId, filePath, fileName);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Job failed' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
