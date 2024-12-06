// app.js
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Initialize the Express app
const app = express();
const port = 3000;

// Set up session middleware
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true
}));

// Set up body parsing middleware for POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up static folder for public assets
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set('view engine', 'ejs');

// Load users from JSON file
function loadUsers() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'users.json'));
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Load resources from JSON file
function loadResources() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'resources.json'));
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Serve home page with resources
app.get('/', (req, res) => {
  const resources = loadResources();
  const user = req.session.user || null; // Ensure user is always defined
  res.render('index', { resources, user });
});

// Serve login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    // Store user info in the session
    req.session.user = user;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Serve signup page
app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// Handle signup form submission
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  
  // Check if the username is already taken
  if (users.find(u => u.username === username)) {
    return res.render('signup', { error: 'Username already exists' });
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create a new user and save to file
  const newUser = { username, password: hashedPassword };
  users.push(newUser);
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));

  // Log the user in and store in session
  req.session.user = newUser;
  res.redirect('/');
});

// Log out the user and destroy the session
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Serve the resource details page
// Serve the resource details page
app.get('/resource/:id', (req, res) => {
  const resources = loadResources();
  const resource = resources.find(r => r.id === req.params.id);

  if (resource) {
    res.render('resource', { resource, user: req.session.user });
  } else {
    res.status(404).send('Resource not found');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
