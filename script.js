// Student data fetched from backend
let students = {};
let loaded = false;

fetch('http://localhost:3002/students')
  .then(res => res.json())
  .then(data => {
    // Transform to name (lowercase): {usn, attendance, originalName}
    students = Object.fromEntries(
      Object.entries(data).map(([usn, info]) => [info.name.toLowerCase(), { usn, attendance: info.attendance, originalName: info.name }])
    );
    loaded = true;
    
    // Check if there are any students
    if (Object.keys(students).length === 0) {
      document.getElementById('errorMessage').textContent = "No students registered yet. Please ask your teacher to add students first.";
      document.getElementById('username').disabled = true;
      document.getElementById('password').disabled = true;
    } else {
      // Enable the form inputs
      document.getElementById('username').disabled = false;
      document.getElementById('password').disabled = false;
    }
  })
  .catch(err => {
    console.error('Error fetching students:', err);
    loaded = true; // even on error, to not block
    document.getElementById('errorMessage').textContent = "Error loading student data. Please try again.";
    // Enable anyway
    document.getElementById('username').disabled = false;
    document.getElementById('password').disabled = false;
  });

// Login form handling
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let username = document.getElementById('username').value.trim();
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

    try {
      // Check eligibility via API
      const response = await fetch(`http://localhost:3002/check-eligibility/${encodeURIComponent(username)}`);
      const result = await response.json();
      
      if (result.eligible) {
        localStorage.setItem('loggedInUser', result.student.name);
        window.location.href = 'feedback.html';
      } else {
        errorMessage.textContent = result.message;
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      errorMessage.textContent = "Error verifying student eligibility. Please try again.";
    }
  });
}

// Authentication check for feedback page
if (document.getElementById('feedbackForm')) {
  const loggedInUser = localStorage.getItem('loggedInUser');
  const userInfo = document.getElementById('loggedInUser');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (!loggedInUser) {
    // Redirect to login if not authenticated
    window.location.href = 'index.html';
  } else {
    // Display logged-in user info
    userInfo.textContent = `Logged in as: ${loggedInUser}`;
    
    // Logout functionality
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });
  }

  // Feedback form handling
  document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const feedback = document.getElementById('feedback').value.trim();
    const classSelect = document.getElementById('classSelect').value;
    const moduleSelect = document.getElementById('moduleSelect').value;
    const successMessage = document.getElementById('successMessage');
    const username = localStorage.getItem('loggedInUser');

    // Validate class and module selection
    if (!classSelect || !moduleSelect) {
      successMessage.textContent = "Please select both class and module.";
      successMessage.style.color = "red";
      return;
    }

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
      const response = await fetch('http://localhost:3002/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, feedback, class: classSelect, module: moduleSelect })
      });
      const result = await response.json();
      if (result.success) {
        successMessage.textContent = result.message;
        successMessage.style.color = "green";
        document.getElementById('feedback').value = '';
        document.getElementById('classSelect').value = '';
        document.getElementById('moduleSelect').value = '';
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