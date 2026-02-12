
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
  SETTINGS: 'AppSettings'
};

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
        settings: sheetToJSON(SHEETS.SETTINGS)[0] || {}
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
  
  const normalizedData = {};
  Object.keys(data).forEach(k => { 
    normalizedData[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = data[k]; 
  });

  const rowData = headers.map(h => {
    const hLower = h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hLower === 'taskid' || hLower === 'id') return id;
    if (hLower === 'createdatetime' || hLower === 'createddate' || hLower === 'date') return new Date();
    if (normalizedData[hLower] !== undefined) return normalizedData[hLower];
    return "";
  });
  
  sheet.appendRow(rowData);
  return { id: id };
}

function handleUpdateTask(data) {
  const sheet = SS.getSheetByName(SHEETS.TASKS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
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
