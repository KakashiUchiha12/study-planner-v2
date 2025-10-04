#!/usr/bin/env node

/**
 * Comprehensive Socket.IO End-to-End Test
 * Tests both backend and frontend Socket.IO functionality
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Test configuration
const SOCKET_IO_SERVER = 'http://localhost:3001';
const NEXTJS_SERVER = 'http://localhost:3000';
const TEST_CONVERSATION_ID = 'test-conversation-123';
const TEST_USER_1 = 'test-user-1';
const TEST_USER_2 = 'test-user-2';

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
}

// Test 1: Socket.IO Server Connection
async function testSocketIOServerConnection() {
  logSection('Testing Socket.IO Server Connection');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    let connected = false;
    let authenticated = false;

    socket.on('connect', () => {
      connected = true;
      logTest('Socket.IO Server Connection', true, `Connected with ID: ${socket.id}`);
      
      // Test authentication
      socket.emit('authenticate', { userId: TEST_USER_1 });
    });

    socket.on('authenticated', (data) => {
      authenticated = true;
      logTest('Socket.IO Authentication', true, `Authenticated as: ${data.userId}`);
      
      // Test conversation joining
      socket.emit('join-conversation', { conversationId: TEST_CONVERSATION_ID });
    });

    socket.on('joined-conversation', (data) => {
      logTest('Socket.IO Join Conversation', true, `Joined conversation: ${data.conversationId}`);
      
      // Test message sending
      const testMessage = {
        id: 'test-msg-1',
        content: 'Test message from Socket.IO test',
        senderId: TEST_USER_1,
        conversationId: TEST_CONVERSATION_ID,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('new-message', { 
        conversationId: TEST_CONVERSATION_ID, 
        message: testMessage 
      });
    });

    socket.on('message-received', (data) => {
      logTest('Socket.IO Message Broadcasting', true, `Received message: ${data.message.content}`);
      
      // Test typing indicators
      socket.emit('typing', { conversationId: TEST_CONVERSATION_ID });
    });

    socket.on('user-typing', (data) => {
      logTest('Socket.IO Typing Indicators', true, `User typing: ${data.userId}`);
      
      // Test stop typing
      setTimeout(() => {
        socket.emit('stop-typing', { conversationId: TEST_CONVERSATION_ID });
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      logTest('Socket.IO Server Connection', false, `Connection error: ${error.message}`);
      resolve();
    });

    socket.on('error', (error) => {
      logTest('Socket.IO Error Handling', false, `Socket error: ${error.message}`);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!connected) {
        logTest('Socket.IO Server Connection', false, 'Connection timeout');
      }
      socket.disconnect();
      resolve();
    }, 15000);
  });
}

// Test 2: Multiple User Simulation
async function testMultipleUsers() {
  logSection('Testing Multiple Users');
  
  return new Promise((resolve) => {
    const user1Socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    const user2Socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    let user1Connected = false;
    let user2Connected = false;
    let messageReceived = false;

    // User 1 setup
    user1Socket.on('connect', () => {
      user1Connected = true;
      logTest('User 1 Connection', true, `Connected with ID: ${user1Socket.id}`);
      user1Socket.emit('authenticate', { userId: TEST_USER_1 });
    });

    user1Socket.on('authenticated', () => {
      user1Socket.emit('join-conversation', { conversationId: TEST_CONVERSATION_ID });
    });

    user1Socket.on('joined-conversation', () => {
      // Send message from user 1
      const message = {
        id: 'test-msg-2',
        content: 'Message from User 1 to User 2',
        senderId: TEST_USER_1,
        conversationId: TEST_CONVERSATION_ID,
        timestamp: new Date().toISOString()
      };
      
      user1Socket.emit('new-message', { 
        conversationId: TEST_CONVERSATION_ID, 
        message 
      });
    });

    // User 2 setup
    user2Socket.on('connect', () => {
      user2Connected = true;
      logTest('User 2 Connection', true, `Connected with ID: ${user2Socket.id}`);
      user2Socket.emit('authenticate', { userId: TEST_USER_2 });
    });

    user2Socket.on('authenticated', () => {
      user2Socket.emit('join-conversation', { conversationId: TEST_CONVERSATION_ID });
    });

    user2Socket.on('message-received', (data) => {
      messageReceived = true;
      logTest('Cross-User Message Delivery', true, `User 2 received message: ${data.message.content}`);
    });

    // Timeout and cleanup
    setTimeout(() => {
      if (!user1Connected) {
        logTest('User 1 Connection', false, 'Connection timeout');
      }
      if (!user2Connected) {
        logTest('User 2 Connection', false, 'Connection timeout');
      }
      if (!messageReceived) {
        logTest('Cross-User Message Delivery', false, 'Message not received');
      }
      
      user1Socket.disconnect();
      user2Socket.disconnect();
      resolve();
    }, 8000);
  });
}

// Test 3: Backend Broadcasting (from Next.js app)
async function testBackendBroadcasting() {
  logSection('Testing Backend Broadcasting');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    let connected = false;
    let messageReceived = false;

    socket.on('connect', () => {
      connected = true;
      logTest('Backend Broadcasting Connection', true, `Connected with ID: ${socket.id}`);
      socket.emit('authenticate', { userId: TEST_USER_1 });
    });

    socket.on('authenticated', () => {
      socket.emit('join-conversation', { conversationId: TEST_CONVERSATION_ID });
    });

      socket.on('joined-conversation', () => {
        // Simulate backend broadcasting by calling the broadcaster directly
        setTimeout(async () => {
          try {
            const { broadcastMessage } = require('./lib/socketio-broadcaster.js');
            const testMessage = {
              id: 'backend-test-msg',
              content: 'Message from backend broadcaster',
              senderId: 'backend-system',
              conversationId: TEST_CONVERSATION_ID,
              timestamp: new Date().toISOString()
            };
            
            broadcastMessage(TEST_CONVERSATION_ID, testMessage);
            logTest('Backend Broadcasting Call', true, 'Broadcast function called successfully');
          } catch (error) {
            logTest('Backend Broadcasting Call', false, `Error: ${error.message}`);
          }
        }, 2000); // Increased timeout to allow broadcaster to connect
      });

    socket.on('message-received', (data) => {
      messageReceived = true;
      logTest('Backend Message Reception', true, `Received backend message: ${data.message.content}`);
    });

    socket.on('connect_error', (error) => {
      logTest('Backend Broadcasting Connection', false, `Connection error: ${error.message}`);
    });

    setTimeout(() => {
      if (!connected) {
        logTest('Backend Broadcasting Connection', false, 'Connection timeout');
      }
      if (!messageReceived) {
        logTest('Backend Message Reception', false, 'Message not received');
      }
      
      socket.disconnect();
      resolve();
    }, 8000);
  });
}

// Test 4: User-Specific Notifications
async function testUserNotifications() {
  logSection('Testing User-Specific Notifications');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    let connected = false;
    let notificationReceived = false;

    socket.on('connect', () => {
      connected = true;
      logTest('User Notifications Connection', true, `Connected with ID: ${socket.id}`);
      socket.emit('authenticate', { userId: TEST_USER_1 });
    });

    socket.on('authenticated', () => {
      // Test user-specific notification
      setTimeout(async () => {
        try {
          const { broadcastToUser } = require('./lib/socketio-broadcaster.js');
          const notification = {
            type: 'notification-count-update',
            unreadCount: 5,
            timestamp: new Date().toISOString()
          };
          
          broadcastToUser(TEST_USER_1, 'notification-count-update', notification);
          logTest('User Notification Broadcasting', true, 'User notification sent');
        } catch (error) {
          logTest('User Notification Broadcasting', false, `Error: ${error.message}`);
        }
      }, 1000);
    });

    socket.on('notification-count-update', (data) => {
      notificationReceived = true;
      logTest('User Notification Reception', true, `Received notification: ${data.unreadCount} unread`);
    });

    socket.on('connect_error', (error) => {
      logTest('User Notifications Connection', false, `Connection error: ${error.message}`);
    });

    setTimeout(() => {
      if (!connected) {
        logTest('User Notifications Connection', false, 'Connection timeout');
      }
      if (!notificationReceived) {
        logTest('User Notification Reception', false, 'Notification not received');
      }
      
      socket.disconnect();
      resolve();
    }, 8000);
  });
}

// Test 5: Next.js API Integration
async function testNextJSIntegration() {
  logSection('Testing Next.js API Integration');
  
  try {
    // Test if Next.js server is running
    const response = await axios.get(`${NEXTJS_SERVER}/api/auth/session`, {
      timeout: 5000
    });
    
    logTest('Next.js Server Health', true, `Server responding: ${response.status}`);
    
    // Test if we can access the messaging API
    try {
      const messagingResponse = await axios.get(`${NEXTJS_SERVER}/api/messaging/conversations`, {
        timeout: 5000
      });
      logTest('Messaging API Access', true, `API responding: ${messagingResponse.status}`);
    } catch (error) {
      logTest('Messaging API Access', false, `API error: ${error.response?.status || error.message}`);
    }
    
  } catch (error) {
    logTest('Next.js Server Health', false, `Server error: ${error.message}`);
  }
}

// Test 6: Connection Stability
async function testConnectionStability() {
  logSection('Testing Connection Stability');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_IO_SERVER, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    let connected = false;
    let reconnected = false;
    let disconnectCount = 0;

    socket.on('connect', () => {
      if (!connected) {
        connected = true;
        logTest('Initial Connection', true, `Connected with ID: ${socket.id}`);
        
        // Test disconnection and reconnection
        setTimeout(() => {
          socket.disconnect();
        }, 2000);
      } else {
        reconnected = true;
        logTest('Reconnection', true, `Reconnected with ID: ${socket.id}`);
      }
    });

    socket.on('disconnect', (reason) => {
      disconnectCount++;
      logTest('Disconnection Handling', true, `Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      logTest('Connection Error Handling', false, `Connection error: ${error.message}`);
    });

    setTimeout(() => {
      if (!connected) {
        logTest('Initial Connection', false, 'Connection timeout');
      }
      if (!reconnected) {
        logTest('Reconnection', false, 'Reconnection timeout');
      }
      
      socket.disconnect();
      resolve();
    }, 12000);
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Socket.IO End-to-End Tests');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    await testSocketIOServerConnection();
    await testMultipleUsers();
    await testBackendBroadcasting();
    await testUserNotifications();
    await testNextJSIntegration();
    await testConnectionStability();
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Socket.IO is working perfectly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
