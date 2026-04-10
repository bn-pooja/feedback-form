// Student data fetched from backend
let students = {};
let loaded = false;

fetch('http://localhost:3001/students')
  .then(res => res.json())
  .then(data => {
    // Transform to name (lowercase): {usn, attendance, originalName}
    students = Object.fromEntries(
      Object.entries(data).map(([usn, info]) => [info.name.toLowerCase(), { usn, attendance: info.attendance, originalName: info.name }])
    );
    loaded = true;
    // Enable the form inputs
    document.getElementById('username').disabled = false;
    document.getElementById('password').disabled = false;
  })
  .catch(err => {
    console.error('Error fetching students:', err);
    loaded = true; // even on error, to not block
    // Enable anyway
    document.getElementById('username').disabled = false;
    document.getElementById('password').disabled = false;
  });

// Login form handling
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    if (!loaded) {
      errorMessage.textContent = "Loading student data, please wait...";
      return;
    }

    if (!username || !password) {
      errorMessage.textContent = "Both fields are required.";
      return;
    }

    if (password !== "password") {
      errorMessage.textContent = "Invalid password.";
      return;
    }

    const user = students[username];
    if (user) {
      if (user.attendance > 75) {
        localStorage.setItem('loggedInUser', user.originalName);
        window.location.href = 'feedback.html';
      } else {
        errorMessage.textContent = "You are not eligible to give feedback.";
      }
    } else {
      errorMessage.textContent = "Invalid username. Available students: " + Object.keys(students).map(key => students[key].originalName).join(', ');
    }
  });
}

// Feedback form handling
if (document.getElementById('feedbackForm')) {
  document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const feedback = document.getElementById('feedback').value.trim();
    const successMessage = document.getElementById('successMessage');
    const username = localStorage.getItem('loggedInUser');

    const words = feedback.split(/\s+/).filter(Boolean);
    const repeatedPattern = /(good|bad)(?:\s+\1){2,}/i;
    const sentenceEnd = /[.!?]$/;

    if (words.length <= 3) {
      successMessage.textContent = "Feedback must contain more than 3 words.";
      successMessage.style.color = "red";
      return;
    }

    if (!sentenceEnd.test(feedback)) {
      successMessage.textContent = "Feedback should be a complete sentence ending with . , ? or !";
      successMessage.style.color = "red";
      return;
    }

    if (repeatedPattern.test(feedback)) {
      successMessage.textContent = "Avoid repeated words like 'good good good' or 'bad bad bad'.";
      successMessage.style.color = "red";
      return;
    }

    if (!/[a-zA-Z]/.test(feedback)) {
      successMessage.textContent = "Feedback must contain valid sentence text.";
      successMessage.style.color = "red";
      return;
    }

    try {
      const response = await fetch('/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, feedback })
      });
      const result = await response.json();
      if (result.success) {
        successMessage.textContent = result.message;
        successMessage.style.color = "green";
        document.getElementById('feedback').value = '';
      } else {
        successMessage.textContent = result.message;
        successMessage.style.color = "red";
      }
    } catch (error) {
      successMessage.textContent = "Error submitting feedback.";
      successMessage.style.color = "red";
    }
  });
}