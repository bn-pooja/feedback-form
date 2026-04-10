const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static('.'));

// In-memory storage for feedback (for simplicity)
let feedbackList = [];

// Predefined student data (moved here for backend, but actually used in frontend)
const students = {
  "USN001": { name: "John Doe", attendance: 80 },
  "USN002": { name: "Jane Smith", attendance: 70 },
  "USN003": { name: "Alice Johnson", attendance: 85 },
  "USN004": { name: "Bob Brown", attendance: 60 }
};

// API to submit feedback
app.post('/submit-feedback', (req, res) => {
  const { username, feedback } = req.body;
  if (feedback && feedback.length >= 10) {
    feedbackList.push({ username, feedback, timestamp: new Date() });
    res.json({ success: true, message: "Feedback submitted successfully." });
  } else {
    res.status(400).json({ success: false, message: "Feedback must be at least 10 characters." });
  }
});

// API to get student data (optional, for frontend)
app.get('/students', (req, res) => {
  res.json(students);
});

// API to add student
app.post('/students', (req, res) => {
  const { name, attendance } = req.body;
  if (name && attendance) {
    const usn = 'USN' + (Object.keys(students).length + 1).toString().padStart(3, '0');
    students[usn] = { name, attendance: Number(attendance) };
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Name and attendance required' });
  }
});

// API to get feedbacks
app.get('/feedbacks', (req, res) => {
  res.json(feedbackList);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});