const fetch = require('node-fetch');

async function testSubjectsAPI() {
  try {
    console.log('Testing subjects API...');
    
    // Test GET /api/subjects
    console.log('\n1. Testing GET /api/subjects...');
    const getResponse = await fetch('http://localhost:3000/api/subjects');
    console.log('GET Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const subjects = await getResponse.json();
      console.log('Subjects found:', subjects.length);
      console.log('First subject:', subjects[0]);
    } else {
      const error = await getResponse.text();
      console.log('GET Error:', error);
    }
    
    // Test POST /api/subjects (this will fail without authentication, but we can see the error)
    console.log('\n2. Testing POST /api/subjects...');
    const postResponse = await fetch('http://localhost:3000/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Subject',
        color: '#FF0000',
        description: 'Test Description'
      })
    });
    console.log('POST Response status:', postResponse.status);
    
    if (postResponse.ok) {
      const newSubject = await postResponse.json();
      console.log('Subject created:', newSubject);
    } else {
      const error = await postResponse.text();
      console.log('POST Error:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Wait a bit for the server to start
setTimeout(testSubjectsAPI, 3000);
