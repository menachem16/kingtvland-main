// Google Apps Script for authentication and data management
// Deploy this as a Web App and use the URL in your application

// Configuration
const SHEET_NAME = 'Customers'; // Name of the sheet
const PLANS_SHEET = 'Plans'; // Name of subscription plans sheet
const ORDERS_SHEET = 'Orders'; // Name of orders sheet

/**
 * Deploy as Web App:
 * 1. Click "Deploy" > "New deployment"
 * 2. Select type: "Web app"
 * 3. Execute as: "Me"
 * 4. Who has access: "Anyone"
 * 5. Copy the Web App URL
 */

// Main handler for GET requests
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'signin':
        return handleSignIn(e);
      case 'signup':
        return handleSignUp(e);
      case 'getSubscription':
        return handleGetSubscription(e);
      case 'getPlans':
        return handleGetPlans(e);
      case 'getOrders':
        return handleGetOrders(e);
      case 'getAllUsers':
        return handleGetAllUsers(e);
      default:
        return createErrorResponse('Unknown action');
    }
  } catch (error) {
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Main handler for POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'updateProfile':
        return handleUpdateProfile(data);
      case 'createSubscription':
        return handleCreateSubscription(data);
      case 'createOrder':
        return handleCreateOrder(data);
      default:
        return createErrorResponse('Unknown action');
    }
  } catch (error) {
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Sign In Handler
function handleSignIn(e) {
  const email = e.parameter.email;
  const password = e.parameter.password;
  
  if (!email || !password) {
    return createErrorResponse('Email and password are required');
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createErrorResponse('Sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const emailColumnIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
  const passwordColumnIndex = headers.indexOf('סיסמה') !== -1 ? headers.indexOf('סיסמה') : headers.indexOf('Password');
  
  if (emailColumnIndex === -1 || passwordColumnIndex === -1) {
    return createErrorResponse('Email or Password column not found in sheet');
  }
  
  // Find user row
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailColumnIndex] === email && data[i][passwordColumnIndex] === password) {
      const userData = {};
      headers.forEach((header, index) => {
        userData[header] = data[i][index];
      });
      
      return createSuccessResponse(userData);
    }
  }
  
  return createErrorResponse('Invalid email or password');
}

// Sign Up Handler
function handleSignUp(e) {
  const email = e.parameter.email || e.postData.contents ? JSON.parse(e.postData.contents).email : null;
  const password = e.parameter.password || e.postData.contents ? JSON.parse(e.postData.contents).password : null;
  const firstName = e.parameter.firstName || e.postData.contents ? JSON.parse(e.postData.contents).firstName : null;
  const lastName = e.parameter.lastName || e.postData.contents ? JSON.parse(e.postData.contents).lastName : null;
  
  if (!email || !password || !firstName || !lastName) {
    return createErrorResponse('All fields are required');
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createErrorResponse('Sheet not found');
  }
  
  // Check if user exists
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailColumnIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
  
  if (emailColumnIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailColumnIndex] === email) {
        return createErrorResponse('User already exists');
      }
    }
  }
  
  // Add new user
  const newId = Utilities.getUuid();
  const rowData = [
    newId,
    firstName,
    lastName,
    email,
    password,
    new Date() // Join date
  ];
  
  sheet.appendRow(rowData);
  
  return createSuccessResponse({
    id: newId,
    email: email,
    firstName: firstName,
    lastName: lastName,
    isAdmin: false
  });
}

// Get Subscription Handler
function handleGetSubscription(e) {
  const userId = e.parameter.userId;
  if (!userId) {
    return createErrorResponse('UserId is required');
  }
  
  // This would query the subscriptions sheet
  // For now, return a simple structure
  return createSuccessResponse(null);
}

// Get Plans Handler
function handleGetPlans(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PLANS_SHEET);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const plans = [];
  for (let i = 1; i < data.length; i++) {
    const plan = {};
    headers.forEach((header, index) => {
      plan[header] = data[i][index];
    });
    plans.push(plan);
  }
  
  return createSuccessResponse(plans);
}

// Get Orders Handler
function handleGetOrders(e) {
  const userId = e.parameter.userId;
  if (!userId) {
    return createErrorResponse('UserId is required');
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdColumnIndex = headers.indexOf('user_id') !== -1 ? headers.indexOf('user_id') : headers.indexOf('User ID');
  
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    if (userIdColumnIndex !== -1 && data[i][userIdColumnIndex] === userId) {
      const order = {};
      headers.forEach((header, index) => {
        order[header] = data[i][index];
      });
      orders.push(order);
    }
  }
  
  return createSuccessResponse(orders);
}

// Get All Users Handler (Admin only)
function handleGetAllUsers(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const user = {};
    headers.forEach((header, index) => {
      // Don't include passwords in the response
      if (header !== 'סיסמה' && header !== 'Password') {
        user[header] = data[i][index];
      }
    });
    users.push(user);
  }
  
  return createSuccessResponse(users);
}

// Update Profile Handler
function handleUpdateProfile(data) {
  const userId = data.userId;
  const updates = data.updates;
  
  if (!userId || !updates) {
    return createErrorResponse('UserId and updates are required');
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createErrorResponse('Sheet not found');
  }
  
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const idColumnIndex = headers.indexOf('מזהה') !== -1 ? headers.indexOf('מזהה') : headers.indexOf('ID');
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][idColumnIndex] === userId) {
      // Update the row
      Object.keys(updates).forEach(key => {
        const columnIndex = headers.indexOf(key);
        if (columnIndex !== -1) {
          sheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
        }
      });
      return createSuccessResponse({ updated: true });
    }
  }
  
  return createErrorResponse('User not found');
}

// Create Subscription Handler
function handleCreateSubscription(data) {
  const { userId, planId, startDate, endDate } = data;
  // Implementation here
  return createSuccessResponse({ id: Utilities.getUuid() });
}

// Create Order Handler
function handleCreateOrder(data) {
  const { userId, amount } = data;
  // Implementation here
  return createSuccessResponse({ id: Utilities.getUuid() });
}

// Helper function to create success response
function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper function to create error response
function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
