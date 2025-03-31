const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
let emergencyContacts = {
  'user-123': [
    { name: 'Sarah Johnson', phone: '+15551234567' },
    { name: 'Emergency Services', phone: '911' }
  ]
};

let activeEmergencies = {};

// API Routes
// Serve articles data
app.get('/api/articles', (req, res) => {
  const articles = require('./data/articles.json');
  res.json(articles);
});

// Get emergency contacts
app.get('/api/contacts/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(emergencyContacts[userId] || []);
});

app.post('/api/contacts/:userId', (req, res) => {
  const { userId } = req.params;
  const { name, phone } = req.body;
  
  if (!emergencyContacts[userId]) {
    emergencyContacts[userId] = [];
  }
  
  emergencyContacts[userId].push({ name, phone });
  res.status(201).json({ message: 'Contact added successfully' });
});

// PCOS Prediction Endpoint (mock)
app.post('/api/predict', (req, res) => {
  const { age, bmi, cycleLength, symptoms } = req.body;
  
  // Mock prediction logic
  let riskScore = 0;
  
  // Age factor (higher risk between 20-35)
  if (age >= 20 && age <= 35) riskScore += 20;
  
  // BMI factor
  if (bmi >= 25) riskScore += bmi >= 30 ? 30 : 20;
  
  // Cycle irregularity
  if (cycleLength === 'irregular') riskScore += 25;
  
  // Symptoms
  if (symptoms && symptoms.length) {
    riskScore += symptoms.length * 10;
  }
  
  // Cap at 100
  riskScore = Math.min(riskScore, 100);
  
  // Determine risk category
  let riskCategory;
  if (riskScore < 30) {
    riskCategory = 'Low Risk';
  } else if (riskScore < 60) {
    riskCategory = 'Moderate Risk';
  } else {
    riskCategory = 'High Risk';
  }
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      riskScore,
      riskCategory,
      recommendations: getRecommendations(riskCategory)
    });
  }, 1000);
});

function getRecommendations(riskCategory) {
  const baseRecommendations = [
    "Maintain a healthy diet rich in whole foods",
    "Exercise regularly (150 minutes per week)",
    "Monitor your menstrual cycle patterns"
  ];
  
  if (riskCategory === 'Low Risk') {
    return [
      ...baseRecommendations,
      "Schedule annual check-ups with your gynecologist"
    ];
  } else if (riskCategory === 'Moderate Risk') {
    return [
      ...baseRecommendations,
      "Consult with a gynecologist for further evaluation",
      "Consider hormonal testing if symptoms persist"
    ];
  } else {
    return [
      ...baseRecommendations,
      "Schedule an appointment with a PCOS specialist immediately",
      "Request blood tests for hormone levels and insulin resistance",
      "Discuss potential medication options with your doctor"
    ];
  }
}

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle emergency alerts
  socket.on('emergency', (data) => {
    const { userId, location } = data;
    console.log(`Emergency alert from user ${userId}`);
    
    // Store active emergency
    activeEmergencies[userId] = {
      timestamp: new Date(),
      location,
      socketId: socket.id
    };
    
    // Notify all clients about the emergency
    io.emit('emergencyAlert', {
      userId,
      message: `Emergency alert from user ${userId}`,
      location,
      timestamp: new Date().toISOString()
    });
    
    // In a real app, this would trigger SMS/email to contacts
    if (emergencyContacts[userId]) {
      emergencyContacts[userId].forEach(contact => {
        console.log(`Notifying ${contact.name} at ${contact.phone}`);
      });
    }
  });
  
  // Handle emergency cancellation
  socket.on('cancelEmergency', (userId) => {
    if (activeEmergencies[userId]) {
      console.log(`Emergency cancelled by user ${userId}`);
      delete activeEmergencies[userId];
      io.emit('emergencyCancelled', { userId });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});