// Google Apps Script for authentication and data management
// Deploy this as a Web App and use the URL in your application

// Configuration
const SHEET_NAME = 'Customers'; // Name of the sheet
const PLANS_SHEET = 'Plans'; // Name of subscription plans sheet
const ORDERS_SHEET = 'Orders'; // Name of orders sheet
const CHAT_ROOMS_SHEET = 'ChatRooms';
const MESSAGES_SHEET = 'Messages';

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
    
    if (!action) {
      return createErrorResponse('Action parameter is required');
    }
    
    switch(action) {
      case 'signin':
        return handleSignIn(e);
    case 'getUserProfile':
      return handleGetUserProfile(e);
      case 'getSubscription':
        return handleGetSubscription(e);
      case 'getPlans':
        return handleGetPlans(e);
      case 'getOrders':
        return handleGetOrders(e);
      case 'getAllUsers':
        return handleGetAllUsers(e);
    case 'getChatRooms':
      return handleGetChatRooms(e);
    case 'getMessages':
      return handleGetMessages(e);
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Main handler for POST requests
function doPost(e) {
  try {
    let action, requestData;
    
    // Handle both JSON and form data
    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
        action = requestData.action;
      } catch (parseError) {
        // Try as form data
        action = e.parameter.action;
        requestData = e.parameter;
      }
    } else {
      action = e.parameter.action;
      requestData = e.parameter;
    }
    
    if (!action) {
      return createErrorResponse('Action parameter is required');
    }
    
    switch(action) {
      case 'signup':
        return handleSignUp(requestData);
      case 'updateProfile':
        return handleUpdateProfile(requestData);
      case 'createSubscription':
        return handleCreateSubscription(requestData);
      case 'createOrder':
        return handleCreateOrder(requestData);
    case 'createChatRoom':
      return handleCreateChatRoom(requestData);
    case 'sendMessage':
      return handleSendMessage(requestData);
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Sign In Handler
function handleSignIn(e) {
  try {
    const email = e.parameter.email;
    const password = e.parameter.password;
    
    if (!email || !password) {
      return createErrorResponse('Email and password are required');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createErrorResponse('Sheet "' + SHEET_NAME + '" not found. Make sure the sheet exists in your spreadsheet.');
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      return createErrorResponse('Sheet is empty');
    }
    
    const headers = data[0];
    
    const emailColumnIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
    const passwordColumnIndex = headers.indexOf('סיסמה') !== -1 ? headers.indexOf('סיסמה') : headers.indexOf('Password');
    
    if (emailColumnIndex === -1) {
      return createErrorResponse('Email column not found. Please add "אימייל" or "Email" column to your sheet.');
    }
    
    if (passwordColumnIndex === -1) {
      return createErrorResponse('Password column not found. Please add "סיסמה" or "Password" column to your sheet.');
    }
    
    // Find user row
    for (let i = 1; i < data.length; i++) {
      const rowEmail = data[i][emailColumnIndex];
      const rowPassword = data[i][passwordColumnIndex];
      
      if (rowEmail && rowEmail.toString().trim().toLowerCase() === email.toLowerCase() && 
          rowPassword && rowPassword.toString() === password) {
        const userData = {};
        headers.forEach((header, index) => {
          // Convert date objects to ISO string
          let value = data[i][index];
          if (value instanceof Date) {
            value = value.toISOString();
          }
          userData[header] = value;
        });
        
        Logger.log('User found: ' + email);
        return createSuccessResponse(userData);
      }
    }
    
    Logger.log('User not found or wrong password: ' + email);
    return createErrorResponse('Invalid email or password');
  } catch (error) {
    Logger.log('Error in handleSignIn: ' + error.toString());
    return createErrorResponse('Sign in error: ' + error.toString());
  }
}

// Sign Up Handler
function handleSignUp(requestData) {
  try {
    const email = requestData.email;
    const password = requestData.password;
    const firstName = requestData.firstName;
    const lastName = requestData.lastName;
    
    if (!email || !password || !firstName || !lastName) {
      return createErrorResponse('All fields are required (email, password, firstName, lastName)');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createErrorResponse('Sheet "' + SHEET_NAME + '" not found');
    }
    
    // Check if user exists
    const data = sheet.getDataRange().getValues();
    const headers = data.length > 0 ? data[0] : [];
    
    // Ensure headers exist (extended schema)
    const requiredHeaders = ['מזהה','שם פרטי','שם משפחה','אימייל','סיסמה','טלפון','מנהל','תאריך הצטרפות','שם משתמש','סיסמת התחברות','נוצר בתאריך','המנוי מסתיים','ימים שנשארו','סוג מנוי'];
    if (headers.length === 0) {
      sheet.appendRow(requiredHeaders);
      requiredHeaders.forEach(h => headers.push(h));
    } else {
      // Add any missing headers to the end
      const missing = requiredHeaders.filter(h => headers.indexOf(h) === -1);
      if (missing.length > 0) {
        const newHeaders = headers.concat(missing);
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
        // update headers array reference
        while (headers.length < newHeaders.length) {
          headers.push(newHeaders[headers.length]);
        }
      }
    }
    
    const emailColumnIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
    
    if (emailColumnIndex !== -1 && data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][emailColumnIndex] && data[i][emailColumnIndex].toString().toLowerCase() === email.toLowerCase()) {
          return createErrorResponse('User already exists');
        }
      }
    }
    
    // Add new user
    const newId = Utilities.getUuid();
    const joinDate = new Date();
    const isAdmin = false;
    
    const idColumnIndex = headers.indexOf('מזהה') !== -1 ? headers.indexOf('מזהה') : headers.indexOf('ID');
    const firstNameColumnIndex = headers.indexOf('שם פרטי') !== -1 ? headers.indexOf('שם פרטי') : headers.indexOf('First Name');
    const lastNameColumnIndex = headers.indexOf('שם משפחה') !== -1 ? headers.indexOf('שם משפחה') : headers.indexOf('Last Name');
    const emailColIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
    const passwordColIndex = headers.indexOf('סיסמה') !== -1 ? headers.indexOf('סיסמה') : headers.indexOf('Password');
    const dateColumnIndex = headers.indexOf('תאריך הצטרפות');
    const adminColumnIndex = headers.indexOf('מנהל');
    const phoneColumnIndex = headers.indexOf('טלפון');
    const usernameColIndex = headers.indexOf('שם משתמש');
    const loginPassColIndex = headers.indexOf('סיסמת התחברות');
    const createdAtColIndex = headers.indexOf('נוצר בתאריך');
    const subEndsColIndex = headers.indexOf('המנוי מסתיים');
    const daysLeftColIndex = headers.indexOf('ימים שנשארו');
    const planTypeColIndex = headers.indexOf('סוג מנוי');
    
    // Create row data based on header positions
    const rowData = new Array(headers.length);
    if (idColumnIndex !== -1) rowData[idColumnIndex] = newId;
    if (firstNameColumnIndex !== -1) rowData[firstNameColumnIndex] = firstName;
    if (lastNameColumnIndex !== -1) rowData[lastNameColumnIndex] = lastName;
    if (emailColIndex !== -1) rowData[emailColIndex] = email;
    if (passwordColIndex !== -1) rowData[passwordColIndex] = password;
    if (dateColumnIndex !== -1) rowData[dateColumnIndex] = joinDate;
    if (adminColumnIndex !== -1) rowData[adminColumnIndex] = isAdmin;
    if (phoneColumnIndex !== -1) rowData[phoneColumnIndex] = '';
    if (usernameColIndex !== -1) rowData[usernameColIndex] = email;
    if (loginPassColIndex !== -1) rowData[loginPassColIndex] = '';
    if (createdAtColIndex !== -1) rowData[createdAtColIndex] = new Date();
    if (subEndsColIndex !== -1) rowData[subEndsColIndex] = '';
    if (daysLeftColIndex !== -1) rowData[daysLeftColIndex] = '';
    if (planTypeColIndex !== -1) rowData[planTypeColIndex] = '';
    
    // Fill empty cells with empty string
    for (let i = 0; i < rowData.length; i++) {
      if (rowData[i] === undefined) {
        rowData[i] = '';
      }
    }
    
    sheet.appendRow(rowData);
    
    Logger.log('New user created: ' + email);
    
    return createSuccessResponse({
      id: newId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      isAdmin: isAdmin,
      joinDate: joinDate.toISOString()
    });
  } catch (error) {
    Logger.log('Error in handleSignUp: ' + error.toString());
    return createErrorResponse('Sign up error: ' + error.toString());
  }
}

// Get Subscription Handler
function handleGetSubscription(e) {
  try {
    const userId = e.parameter.userId;
    if (!userId) {
      return createErrorResponse('UserId is required');
    }
    
    // This would query the subscriptions sheet
    // For now, return null
    return createSuccessResponse(null);
  } catch (error) {
    Logger.log('Error in handleGetSubscription: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Get Plans Handler
function handleGetPlans(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PLANS_SHEET);
    if (!sheet) {
      Logger.log('Plans sheet not found, returning empty array');
      return createSuccessResponse([]);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createSuccessResponse([]);
    }
    
    const headers = data[0];
    
    const plans = [];
    for (let i = 1; i < data.length; i++) {
      const plan = {};
      headers.forEach((header, index) => {
        let value = data[i][index];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        plan[header] = value;
      });
      plans.push(plan);
    }
    
    return createSuccessResponse(plans);
  } catch (error) {
    Logger.log('Error in handleGetPlans: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Get Orders Handler
function handleGetOrders(e) {
  try {
    const userId = e.parameter.userId;
    if (!userId) {
      return createErrorResponse('UserId is required');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
    if (!sheet) {
      return createSuccessResponse([]);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createSuccessResponse([]);
    }
    
    const headers = data[0];
    const userIdColumnIndex = headers.indexOf('user_id') !== -1 ? headers.indexOf('user_id') : headers.indexOf('User ID');
    
    if (userIdColumnIndex === -1) {
      return createSuccessResponse([]);
    }
    
    const orders = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][userIdColumnIndex] && data[i][userIdColumnIndex].toString() === userId.toString()) {
        const order = {};
        headers.forEach((header, index) => {
          let value = data[i][index];
          if (value instanceof Date) {
            value = value.toISOString();
          }
          order[header] = value;
        });
        orders.push(order);
      }
    }
    
    return createSuccessResponse(orders);
  } catch (error) {
    Logger.log('Error in handleGetOrders: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Get All Users Handler (Admin only)
function handleGetAllUsers(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createSuccessResponse([]);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createSuccessResponse([]);
    }
    
    const headers = data[0];
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      const user = {};
      headers.forEach((header, index) => {
        // Don't include passwords in the response
        if (header !== 'סיסמה' && header !== 'Password') {
          let value = data[i][index];
          if (value instanceof Date) {
            value = value.toISOString();
          }
          user[header] = value;
        }
      });
      users.push(user);
    }
    
    return createSuccessResponse(users);
  } catch (error) {
    Logger.log('Error in handleGetAllUsers: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

function ensureSheetWithHeaders(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(headers);
  } else {
    const existingHeaders = data[0];
    const missing = headers.filter(h => existingHeaders.indexOf(h) === -1);
    if (missing.length > 0) {
      const newHeaders = existingHeaders.concat(missing);
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

// Chat: Get chat rooms for a user
function handleGetChatRooms(e) {
  try {
    const userId = e.parameter.userId;
    if (!userId) return createErrorResponse('userId is required');
    const sheet = ensureSheetWithHeaders(CHAT_ROOMS_SHEET, ['id','user_id','subject','status','created_at']);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return createSuccessResponse([]);
    const headers = values[0];
    const userIdIdx = headers.indexOf('user_id');
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      if (!values[i][userIdIdx]) continue;
      if (values[i][userIdIdx].toString() !== userId.toString()) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        let v = values[i][idx];
        if (v instanceof Date) v = v.toISOString();
        obj[h] = v;
      });
      rows.push(obj);
    }
    // Sort desc by created_at
    rows.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return createSuccessResponse(rows);
  } catch (err) {
    return createErrorResponse('Error: ' + err.toString());
  }
}

// Chat: Get messages for a room
function handleGetMessages(e) {
  try {
    const roomId = e.parameter.roomId;
    if (!roomId) return createErrorResponse('roomId is required');
    const sheet = ensureSheetWithHeaders(MESSAGES_SHEET, ['id','chat_room_id','sender_id','content','is_admin','created_at']);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return createSuccessResponse([]);
    const headers = values[0];
    const roomIdIdx = headers.indexOf('chat_room_id');
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i][roomIdIdx] && values[i][roomIdIdx].toString() === roomId.toString()) {
        const obj = {};
        headers.forEach((h, idx) => {
          let v = values[i][idx];
          if (v instanceof Date) v = v.toISOString();
          obj[h] = v;
        });
        rows.push(obj);
      }
    }
    // Sort asc by created_at
    rows.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return createSuccessResponse(rows);
  } catch (err) {
    return createErrorResponse('Error: ' + err.toString());
  }
}

// Chat: Create chat room
function handleCreateChatRoom(data) {
  try {
    const userId = data.userId;
    const subject = data.subject || '';
    if (!userId) return createErrorResponse('userId is required');
    const sheet = ensureSheetWithHeaders(CHAT_ROOMS_SHEET, ['id','user_id','subject','status','created_at']);
    const id = Utilities.getUuid();
    const now = new Date();
    const row = [id, userId, subject, 'open', now];
    sheet.appendRow(row);
    return createSuccessResponse({ id, user_id: userId, subject, status: 'open', created_at: now.toISOString() });
  } catch (err) {
    return createErrorResponse('Error: ' + err.toString());
  }
}

// Chat: Send message
function handleSendMessage(data) {
  try {
    const roomId = data.roomId;
    const senderId = data.senderId;
    const content = data.content;
    const isAdmin = !!data.isAdmin;
    if (!roomId || !senderId || !content) return createErrorResponse('roomId, senderId, content are required');
    const sheet = ensureSheetWithHeaders(MESSAGES_SHEET, ['id','chat_room_id','sender_id','content','is_admin','created_at']);
    const id = Utilities.getUuid();
    const now = new Date();
    const row = [id, roomId, senderId, content, isAdmin, now];
    sheet.appendRow(row);
    return createSuccessResponse({ id, chat_room_id: roomId, sender_id: senderId, content, is_admin: isAdmin, created_at: now.toISOString() });
  } catch (err) {
    return createErrorResponse('Error: ' + err.toString());
  }
}

// Get User Profile by email
function handleGetUserProfile(e) {
  try {
    const email = e.parameter.email;
    if (!email) {
      return createErrorResponse('Email is required');
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createErrorResponse('Sheet not found');
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createSuccessResponse(null);
    }
    const headers = data[0];
    const emailColumnIndex = headers.indexOf('אימייל') !== -1 ? headers.indexOf('אימייל') : headers.indexOf('Email');
    if (emailColumnIndex === -1) {
      return createErrorResponse('Email column not found');
    }
    for (let i = 1; i < data.length; i++) {
      const rowEmail = data[i][emailColumnIndex];
      if (rowEmail && rowEmail.toString().toLowerCase() === email.toLowerCase()) {
        const rowObj = {};
        headers.forEach((header, index) => {
          let value = data[i][index];
          if (value instanceof Date) value = value.toISOString();
          rowObj[header] = value;
        });
        // compute days remaining if possible
        const endDateIdx = headers.indexOf('המנוי מסתיים');
        if (endDateIdx !== -1 && data[i][endDateIdx]) {
          const endDate = new Date(data[i][endDateIdx]);
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          rowObj['ימים שנשארו'] = days;
        }
        return createSuccessResponse(rowObj);
      }
    }
    return createSuccessResponse(null);
  } catch (error) {
    Logger.log('Error in handleGetUserProfile: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Update Profile Handler
function handleUpdateProfile(data) {
  try {
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
    if (dataRange.length <= 1) {
      return createErrorResponse('No users found');
    }
    
    const headers = dataRange[0];
    const idColumnIndex = headers.indexOf('מזהה') !== -1 ? headers.indexOf('מזהה') : headers.indexOf('ID');
    
    if (idColumnIndex === -1) {
      return createErrorResponse('ID column not found');
    }
    
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][idColumnIndex] && dataRange[i][idColumnIndex].toString() === userId.toString()) {
        // Update the row
        Object.keys(updates).forEach(key => {
          // Map camelCase to Hebrew/English column names
          let columnName = key;
          if (key === 'isAdmin') {
            columnName = 'מנהל';
          } else if (key === 'firstName') {
            columnName = 'שם פרטי';
          } else if (key === 'lastName') {
            columnName = 'שם משפחה';
          } else if (key === 'phone') {
            columnName = 'טלפון';
          }
          
          const columnIndex = headers.indexOf(columnName);
          if (columnIndex !== -1) {
            sheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
          }
        });
        
        Logger.log('Profile updated for user: ' + userId);
        return createSuccessResponse({ updated: true });
      }
    }
    
    return createErrorResponse('User not found');
  } catch (error) {
    Logger.log('Error in handleUpdateProfile: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Create Subscription Handler
function handleCreateSubscription(data) {
  try {
    const { userId, planId, startDate, endDate } = data;
    // Implementation here
    return createSuccessResponse({ id: Utilities.getUuid() });
  } catch (error) {
    Logger.log('Error in handleCreateSubscription: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Create Order Handler
function handleCreateOrder(data) {
  try {
    const { userId, amount } = data;
    // Implementation here
    return createSuccessResponse({ id: Utilities.getUuid() });
  } catch (error) {
    Logger.log('Error in handleCreateOrder: ' + error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

// Helper function to create success response
function createSuccessResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
  
  return output;
}

// Helper function to create error response
function createErrorResponse(message) {
  const output = ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
  
  return output;
}
