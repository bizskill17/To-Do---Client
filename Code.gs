
/**
 * TASK CA - Backend Automation
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

// Sheet names constant for consistency
const SHEETS = {
  TASKS: 'Tasks',
  LOGS: 'ActionLogs',
  RECURRING: 'RecurringTasks',
  REC_ACTIONS: 'RecurringActions',
  USERS: 'Users', // Updated from 'Assignees' to 'Users'
  CLIENTS: 'Clients',
  FIRMS: 'Firms',
  CATEGORIES: 'Categories',
  TEMPLATES: 'TaskTemplates',
  SETTINGS: 'AppSettings',
  MESSAGE_SETTINGS: 'Settings'
};

function normalizeTo10Digits(numberLike) {
  const digits = String(numberLike || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length <= 10 ? digits : digits.slice(-10);
}

function getMessageSettingsRow() {
  const sheet = SS.getSheetByName(SHEETS.MESSAGE_SETTINGS);
  if (!sheet) return { userId: '', password: '', ownerNumber: '' };

  // A2: User Id, B2: Password, C2: Owner Number
  const values = sheet.getRange(2, 1, 1, 3).getValues()[0] || [];
  return {
    userId: String(values[0] || '').trim(),
    password: String(values[1] || '').trim(),
    ownerNumber: normalizeTo10Digits(values[2])
  };
}

function getUserMobileByAssignee(assigneeNameOrId) {
  const name = String(assigneeNameOrId || '').trim().toLowerCase();
  if (!name) return '';

  const sheet = SS.getSheetByName(SHEETS.USERS);
  if (!sheet) return '';

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return '';
  const headers = data[0].map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  const idxName = headers.indexOf('name');
  const idxId = headers.indexOf('id');
  const mobileKeys = ['mobile', 'mobileno', 'mobilenumber', 'phonenumber', 'phone', 'whatsapp', 'whatsappnumber'];
  let idxMobile = -1;
  for (let k = 0; k < mobileKeys.length; k++) {
    const idx = headers.indexOf(mobileKeys[k]);
    if (idx !== -1) { idxMobile = idx; break; }
  }
  if (idxMobile === -1) return '';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowName = idxName >= 0 ? String(row[idxName] || '').trim().toLowerCase() : '';
    const rowId = idxId >= 0 ? String(row[idxId] || '').trim().toLowerCase() : '';
    if (rowName === name || rowId === name) {
      return normalizeTo10Digits(row[idxMobile]);
    }
  }
  return '';
}

function buildNewTaskMessage(taskTitle, createdBy, assigneeName, createdAt) {
  const createdAtStr = createdAt
    ? Utilities.formatDate(createdAt, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
    : '';

  // Keep it short and WhatsApp-friendly
  return [
    "*NEW TASK ASSIGNED*",
    taskTitle ? `Task: ${taskTitle}` : null,
    assigneeName ? `Assignee: ${assigneeName}` : null,
    createdBy ? `Created By: ${createdBy}` : null,
    createdAtStr ? `Created At: ${createdAtStr}` : null
  ].filter(Boolean).join("\n");
}

function buildUpdateTaskMessage(taskTitle, status, remarks, updatedAt) {
  const updatedAtStr = updatedAt
    ? Utilities.formatDate(updatedAt, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
    : '';

  return [
    "*TASK UPDATED*",
    taskTitle ? `Task: ${taskTitle}` : null,
    status ? `Status: ${status}` : null,
    remarks ? `Remarks: ${remarks}` : null,
    updatedAtStr ? `Updated At: ${updatedAtStr}` : null
  ].filter(Boolean).join("\n");
}

function sendWhatsAppMessage(receiverMobileNo, messageText) {
  const creds = getMessageSettingsRow();
  if (!creds.userId || !creds.password || !creds.ownerNumber) {
    Logger.log("Message Settings missing (UserId/Password/OwnerNumber). Skipping message send.");
    return { success: false, error: "Missing settings" };
  }

  const toNumber = normalizeTo10Digits(receiverMobileNo);
  if (!toNumber || toNumber.length !== 10) {
    Logger.log("Invalid receiverMobileNo: " + receiverMobileNo);
    return { success: false, error: "Invalid receiverMobileNo" };
  }

  const url = "https://app.messageautosender.com/api/v1/message/create";
  const payload = {
    // receiverMobileNo = the destination number to send the message to
    receiverMobileNo: toNumber,
    // recipientIds = the connected WhatsApp number/device (Owner Number)
    recipientIds: [creds.ownerNumber],
    message: [String(messageText || '')]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      accept: 'application/json',
      Authorization: 'Basic ' + Utilities.base64Encode(creds.userId + ":" + creds.password),
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  try {
    Logger.log("Sending message. From(owner): " + creds.ownerNumber + " To: " + toNumber);
    const response = UrlFetchApp.fetch(url, options);
    Logger.log("Message API status: " + response.getResponseCode());
    Logger.log(response.getContentText());
    return { success: true, status: response.getResponseCode() };
  } catch (e) {
    Logger.log(e);
    return { success: false, error: String(e) };
  }
}

function sheetToJSON(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return [];
  
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      }
      // Use robust normalization: lowercase and remove all non-alphanumeric characters
      let key = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      obj[key] = val;
    });
    return obj;
  });
}

function doGet(e) {
  const action = e.parameter.action;
  const workspaceId = e.parameter.workspaceId;

  // Handle Registry Lookup if needed
  if (workspaceId && !action) {
     // This part is usually in the Master Registry Script, 
     // but if this script acts as registry too, we'd handle it here.
  }

  try {
    let result;
	    if (action === 'init') {
	      result = {
	        mainTasks: sheetToJSON(SHEETS.TASKS),
	        users: sheetToJSON(SHEETS.USERS),
	        clients: sheetToJSON(SHEETS.CLIENTS),
	        firms: sheetToJSON(SHEETS.FIRMS),
	        categories: sheetToJSON(SHEETS.CATEGORIES),
	        actionLogs: sheetToJSON(SHEETS.LOGS),
	        recurringTasks: sheetToJSON(SHEETS.RECURRING),
	        recurringActions: sheetToJSON(SHEETS.REC_ACTIONS),
	        taskTemplates: sheetToJSON(SHEETS.TEMPLATES),
	        settings: sheetToJSON(SHEETS.SETTINGS)[0] || {},
	        messageSettings: sheetToJSON(SHEETS.MESSAGE_SETTINGS)[0] || {}
	      };
	    } else {
	      result = sheetToJSON(action);
	    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const payload = params.data;
    const target = params.target;
    
	    let result;
	    switch (action) {
	      case 'addTask': result = handleAddTask(payload); break;
	      case 'updateTask': result = handleUpdateTask(payload); break;
	      case 'addMaster': result = handleAddMaster(target, payload); break;
	      case 'updateMaster': result = handleUpdateMaster(target, payload); break;
	      case 'deleteRecord': result = handleDeleteRecord(target, payload.id); break;
	      case 'saveMessageSettings': result = handleSaveSingleRow(SHEETS.MESSAGE_SETTINGS, payload); break;
	      case 'deleteMessageSettings': result = handleDeleteSingleRow(SHEETS.MESSAGE_SETTINGS); break;
	      default: throw new Error("Invalid action");
	    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddTask(data) {
  const sheet = SS.getSheetByName(SHEETS.TASKS);
  const id = "task_" + new Date().getTime().toString(16);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const createdAt = new Date();
	  
  const normalizedData = {};
  Object.keys(data).forEach(k => { 
    normalizedData[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = data[k]; 
  });

  const rowData = headers.map(h => {
    const hLower = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hLower === 'taskid' || hLower === 'id') return id;
    if (hLower === 'createdatetime' || hLower === 'createddate' || hLower === 'date') return createdAt;
    if (normalizedData[hLower] !== undefined) return normalizedData[hLower];
    return "";
  });
	  
  sheet.appendRow(rowData);

  // Send WhatsApp message to Assignee + Owner (single sender = Owner Number)
  try {
    const taskTitle = String(normalizedData.task || normalizedData.title || '');
    const assigneeName = String(normalizedData.assignee || '');
    const createdBy = String(normalizedData.createdby || '');
    const assigneeMobile =
      normalizeTo10Digits(normalizedData.assigneenumber) ||
      getUserMobileByAssignee(assigneeName || normalizedData.assigneeid);
    const ownerNumber = getMessageSettingsRow().ownerNumber;
    const msg = buildNewTaskMessage(taskTitle, createdBy, assigneeName, createdAt);
    Logger.log("Assign recipients. Assignee: " + assigneeMobile + " Owner: " + ownerNumber);
    if (assigneeMobile) sendWhatsAppMessage(assigneeMobile, msg);
    if (ownerNumber) sendWhatsAppMessage(ownerNumber, msg);
  } catch (e) {
    Logger.log("AddTask message send failed: " + e);
  }

  return { id: id };
}

function handleUpdateTask(data) {
  const sheet = SS.getSheetByName(SHEETS.TASKS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const updatedAt = new Date();
	  
  const taskId = String(data.id || data.taskid);
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === taskId) { 
      rowIndex = i + 1; 
      break; 
    }
  }
  if (rowIndex === -1) throw new Error("Task not found");
  
  headers.forEach((h, i) => {
    const hLower = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hLower === 'taskid' || hLower === 'id' || hLower === 'createdatetime') return;
    if (data[hLower] !== undefined) {
      sheet.getRange(rowIndex, i + 1).setValue(data[hLower]);
    }
  });

  // Send WhatsApp message only to Owner on update
  try {
    const status = String(data.status || '');
    const remarks = String(data.lastupdateremarks || data.remarks || '');
    const taskTitleCell = (() => {
      const idx = headers.map(x => String(x || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')).indexOf('task');
      if (idx === -1) return '';
      return String(sheet.getRange(rowIndex, idx + 1).getValue() || '');
    })();

    const ownerNumber = getMessageSettingsRow().ownerNumber;
    const msg = buildUpdateTaskMessage(taskTitleCell, status, remarks, updatedAt);
    sendWhatsAppMessage(ownerNumber, msg);
  } catch (e) {
    Logger.log("UpdateTask message send failed: " + e);
  }
	  
  return { success: true };
}

function handleAddMaster(target, data) {
  const sheet = SS.getSheetByName(target);
  const id = new Date().getTime();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(h => {
    const hLower = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hLower === 'id') return id;
    const key = Object.keys(data).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === hLower);
    return key ? data[key] : "";
  });
  sheet.appendRow(rowData);
  return { id: id };
}

function handleUpdateMaster(target, data) {
  const sheet = SS.getSheetByName(target);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) throw new Error("Record not found");
  
  headers.forEach((h, i) => {
    const hLower = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = Object.keys(data).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === hLower);
    if (key && hLower !== 'id') {
      sheet.getRange(rowIndex, i + 1).setValue(data[key]);
    }
  });
  return true;
}

function handleDeleteRecord(target, id) {
  const sheet = SS.getSheetByName(target);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) { 
      sheet.deleteRow(i + 1); 
      return true; 
    }
  }
  return false;
}

function handleSaveSingleRow(sheetName, data) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error(`No headers found in: ${sheetName}`);

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const normalizedData = {};
  Object.keys(data || {}).forEach(k => {
    normalizedData[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = data[k];
  });

  const rowData = headers.map(h => {
    const key = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalizedData[key] !== undefined ? normalizedData[key] : "";
  });

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  sheet.getRange(2, 1, 1, lastCol).setValues([rowData]);
  return true;
}

function handleDeleteSingleRow(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  return true;
}
