
// Simple test to check if the server is responding
fetch('http://localhost:8081/api/health')
  .then(res => res.json())
  .then(data => {

  })
  .catch(err => {
    console.error('❌ Health check failed:', err.message);
  });