// Test script to verify deployment works
// Run this in browser console after deployment

async function testDeployment() {
  const baseUrl = window.location.origin;
  
  console.log('🧪 Testing deployment at:', baseUrl);
  
  // Test 1: Check if we can access employees endpoint
  try {
    const response = await fetch(`${baseUrl}/api/admin/employees`, {
      credentials: 'include'
    });
    
    console.log('📊 Employees API Status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ Not authenticated - please login first');
      return;
    }
    
    if (response.status === 403) {
      console.log('❌ Not authorized - admin access required');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Employees API working:', data.employees?.length || 0, 'employees found');
    }
    
  } catch (error) {
    console.error('❌ Employees API Error:', error);
  }
  
  // Test 2: Check cookies
  const cookies = document.cookie;
  const hasSessionToken = cookies.includes('better-auth.session_token');
  
  console.log('🍪 Session Cookie Present:', hasSessionToken);
  
  if (!hasSessionToken) {
    console.log('❌ No session cookie found - authentication may have failed');
  } else {
    console.log('✅ Session cookie found');
  }
  
  // Test 3: Try creating a test employee (if authenticated)
  if (hasSessionToken) {
    try {
      const testEmployee = {
        name: "Test Employee",
        email: `test-${Date.now()}@example.com`,
        phone: `555${Math.floor(Math.random() * 10000000)}`,
        role: "CASHIER",
        status: "ACTIVE",
        dutyType: "FULL_TIME",
        shift: "DAY",
        joiningDate: new Date().toISOString().split('T')[0],
        monthlySalary: 3000,
        imageUrl: null
      };
      
      const createResponse = await fetch(`${baseUrl}/api/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testEmployee)
      });
      
      console.log('📝 Create Employee Status:', createResponse.status);
      
      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log('✅ Employee creation working:', result.employee?.name);
        
        // Clean up - delete the test employee
        if (result.employee?.id) {
          const deleteResponse = await fetch(`${baseUrl}/api/admin/employees/${result.employee.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (deleteResponse.ok) {
            console.log('🗑️ Test employee cleaned up successfully');
          }
        }
      } else {
        const error = await createResponse.json();
        console.log('❌ Employee creation failed:', error.error);
      }
      
    } catch (error) {
      console.error('❌ Employee creation test error:', error);
    }
  }
  
  console.log('🏁 Deployment test completed');
}

// Run the test
testDeployment();