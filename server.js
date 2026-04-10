const express = require('express');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static('.'));

const fs = require('fs');
const path = require('path');

// File paths
const studentsFile = path.join(__dirname, 'students.json');
const feedbackFile = path.join(__dirname, 'feedbacks.json');

// Helper to read students from file
function readStudents() {
  try {
    return JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Helper to write students to file
function writeStudents(students) {
  fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
}

// Helper to read feedbacks from file
function readFeedbacks() {
  try {
    return JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

// Helper to write feedbacks to file
function writeFeedbacks(feedbacks) {
  fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
}

// API to submit feedback
app.post('/submit-feedback', (req, res) => {
  const { username, feedback, class: className, module } = req.body;
  if (feedback && feedback.length >= 10) {
    const feedbackList = readFeedbacks();
    feedbackList.push({ username, feedback, class: className, module, timestamp: new Date() });
    writeFeedbacks(feedbackList);
    res.json({ success: true, message: "Feedback submitted successfully." });
  } else {
    res.status(400).json({ success: false, message: "Feedback must be at least 10 characters." });
  }
});

// API to get student data (optional, for frontend)
app.get('/students', (req, res) => {
  const students = readStudents();
  res.json(students);
});

// API to add student
app.post('/students', (req, res) => {
  const { name, attendance } = req.body;
  if (name && attendance) {
    const students = readStudents();
    const usn = 'USN' + (Object.keys(students).length + 1).toString().padStart(3, '0');
    students[usn] = { name, attendance: Number(attendance) };
    writeStudents(students);
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Name and attendance required' });
  }
});

// API to check student eligibility
app.get('/check-eligibility/:studentName', (req, res) => {
  const studentName = req.params.studentName.toLowerCase();
  const students = readStudents();
  
  // Find student by name (case insensitive)
  const student = Object.values(students).find(s => s.name.toLowerCase() === studentName);
  
  if (!student) {
    return res.json({ eligible: false, message: 'Student not found' });
  }
  
  // Check eligibility (attendance >= 75)
  const eligible = student.attendance >= 75;
  res.json({ 
    eligible, 
    student: { name: student.name, attendance: student.attendance },
    message: eligible ? 'Student is eligible' : 'Student not eligible (attendance below 75%)'
  });
});

// API to get feedbacks
app.get('/feedbacks', (req, res) => {
  const feedbackList = readFeedbacks();
  res.json(feedbackList);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});