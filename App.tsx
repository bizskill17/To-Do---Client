import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { TasksView } from './components/TasksView';
import { KanbanView } from './components/KanbanView';
import { BulkAddTaskView } from './components/BulkAddTaskView';
import { UsersView } from './components/UsersView';
import { ActionLogView } from './components/ActionLogView';
import { LoginView } from './components/LoginView';
import { MessageSettingsView } from './components/MessageSettingsView';
import { ClientsView } from './components/ClientsView';
import { AddTaskModal } from './components/AddTaskModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AddUserModal } from './components/AddUserModal';
import { AddClientModal } from './components/AddClientModal';
import { EditTaskModal } from './components/EditTaskModal'; 
import { UpdateTaskModal } from './components/UpdateTaskModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { 
  LayoutDashboard, 
  CheckSquare, 
	Clock, 
	CheckCircle, 
	Users, 
	Menu,
	Trello,
	PlusSquare,
	MessageSquare,
  Building2
} from 'lucide-react';
import { NavItem, Task, User, Category, Client, Firm, ActionLogEntry, RecurringTask, RecurringTaskAction, AppSettings, TaskTemplate, MessageSettings } from './types';

const MASTER_REGISTRY_URL = "https://script.google.com/macros/s/AKfycbxslML8NWR3Z-6FDIJT3tXFGmBtMZUgtxRQ-QSlGIVWXUdPyKbQ45k7vnFF1HPpvuV3/exec";
const AUTO_SYNC_INTERVAL = 120000;

export const formatToIndianDate = (dateInput: any): string => {
  if (!dateInput) return '';
  const s = String(dateInput).trim();
  const match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
      return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return s;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch { return s; }
};

export const formatToIndianDateTime = (dateInput: any): string => {
  if (!dateInput) return '';
  let s = String(dateInput).trim();
  
  // Try matching various formats
  const match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?/i);
  if (match) {
      const [_, d, m, y, hh, mm, ss, ampm] = match;
      const datePart = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      if (hh && mm) {
          let h = parseInt(hh);
          if (ampm) {
            if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
            if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
          }
          return `${datePart} ${String(h).padStart(2, '0')}:${mm.padStart(2, '0')}`;
      }
      return datePart;
  }
  
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const datePart = `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    if (isoMatch[4] && isoMatch[5]) {
       return `${datePart} ${isoMatch[4]}:${isoMatch[5]}`;
    }
    return datePart;
  }
  
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return s;
    const datePart = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const h = d.getHours();
    const m = d.getMinutes();
    return `${datePart} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } catch { return s; }
};

export const parseToISO = (str: string) => {
    if (!str) return '';
    const trimmed = str.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.split(/[ T]/)[0];
    const datePart = trimmed.split(' ')[0]; 
    const parts = datePart.split(/[/-]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return trimmed;
};

export const parseToTimestamp = (dateInput: any): number => {
  if (!dateInput) return NaN;
  const s = String(dateInput).trim();
  if (!s) return NaN;

  // DD/MM/YYYY HH:mm(:ss) (optional AM/PM)
  const dmY = s.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?/i
  );
  if (dmY) {
    const day = parseInt(dmY[1], 10);
    const month = parseInt(dmY[2], 10) - 1;
    const year = parseInt(dmY[3], 10);
    let hour = dmY[4] ? parseInt(dmY[4], 10) : 0;
    const minute = dmY[5] ? parseInt(dmY[5], 10) : 0;
    const second = dmY[6] ? parseInt(dmY[6], 10) : 0;
    const ampm = (dmY[7] || '').toUpperCase();

    if (ampm) {
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }

    const d = new Date(year, month, day, hour, minute, second);
    const t = d.getTime();
    return Number.isNaN(t) ? NaN : t;
  }

  // ISO-like: YYYY-MM-DD or YYYY-MM-DD HH:mm(:ss) or with 'T'
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    const year = parseInt(iso[1], 10);
    const month = parseInt(iso[2], 10) - 1;
    const day = parseInt(iso[3], 10);
    const hour = iso[4] ? parseInt(iso[4], 10) : 0;
    const minute = iso[5] ? parseInt(iso[5], 10) : 0;
    const second = iso[6] ? parseInt(iso[6], 10) : 0;
    const d = new Date(year, month, day, hour, minute, second);
    const t = d.getTime();
    return Number.isNaN(t) ? NaN : t;
  }

  const d = new Date(s);
  const t = d.getTime();
  return Number.isNaN(t) ? NaN : t;
};

async function safeJsonParse(response: Response, sourceName: string) {
  const text = await response.text();
  if (text.toLowerCase().includes("404 file not found") || text.includes("<!DOCTYPE html>")) {
    throw new Error(`Backend service currently unavailable.`);
  }
  try {
    const json = JSON.parse(text);
    if (json.success === false) throw new Error(json.error || 'Server error.');
    return json;
  } catch (err: any) {
    throw new Error(`${sourceName} response error.`);
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('taskpro_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [workspaceId] = useState<string>(() => localStorage.getItem('taskpro_workspace_id') || '');
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem('taskpro_api_url') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [layoutMode, setLayoutMode] = useState<'side' | 'top'>(() => (localStorage.getItem('taskpro_layout') as any) || 'side');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string | number>>(new Set<string | number>());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]); 
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [recurringActions, setRecurringActions] = useState<RecurringTaskAction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    officeTokenId: '', officeTelegramGroupId: '', whatsappGroupId: '', masId: '',
    masPassword: '', metaAccessToken: '', metaPhoneNumberId: '', metaWabaId: '', metaVerifyToken: ''
  });
  const [messageSettings, setMessageSettings] = useState<MessageSettings>({ userId: '', password: '', ownerNumber: '' });
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);

  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priorities');
  const [filterClient, setFilterClient] = useState('All Clients'); 
  const [filterOwner, setFilterOwner] = useState('All Partners');
  const [filterAssignee, setFilterAssignee] = useState('All Leaders');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastUpdateFrom, setLastUpdateFrom] = useState('');
  const [lastUpdateTo, setLastUpdateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false); 
  const [isFirmModalOpen, setIsFirmModalOpen] = useState(false); 

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);

  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<Task | null>(null);

  const fetchData = useCallback(async (showLoading = true, targetSheet?: string) => {
    if (!apiUrl) return;
    if (showLoading) setIsLoading(true);
    else setIsSyncing(true);
    
    try {
      const cleanApiUrl = apiUrl.trim().split('?')[0];
      const action = targetSheet ? targetSheet : 'init';
      const response = await fetch(`${cleanApiUrl}${cleanApiUrl.includes('?') ? '&' : '?'}action=${action}&_cb=${Date.now()}`, { 
        cache: 'no-store',
        mode: 'cors'
      });
      const result = await safeJsonParse(response, targetSheet || 'Initial Load');
      
	      if (result.success) {
	        const { data } = result;

	        const normalizeTasks = (list: any[]) => (list || []).map(item => ({
	            ...item,
	            id: item.taskid || item.id || 0,
	            title: String(item.task || item.title || ''),
	            assigneeId: String(item.assigneeid || ''),
	            assignee: String(item.assignee || ''),
	            assigneeNumber: String(item.assigneenumber || ''),
              clientId: String(item.clientid || ''),
              clientName: String(item.clientname || ''),
              clientMobile: String(item.clientmobilenumber || ''),
	            status: String(item.status || 'Not Yet Started'),
	            date: formatToIndianDateTime(item.createdatetime || item.date || ''),
              dueDate: formatToIndianDate(item.duedate || item.dueDate || ''),
	            createdBy: String(item.createdby || ''),
	            lastUpdateDate: formatToIndianDateTime(item.lastupdated || ''),
	            lastUpdateRemarks: String(item.lastupdateremarks || ''),
	        }));

	        if (targetSheet === 'Tasks') {
	            setTasks(normalizeTasks(data));
	        } else if (targetSheet === 'Client' || targetSheet === 'Clients') {
	            setClients((data || []).map((c: any) => ({
                ...c,
                id: Number(c.clientid || c.id || 0),
                name: String(c.clientname || c.name || ''),
                mobile: String(c.clientmobilenumber || c.mobile || '')
              })));
	        } else if (targetSheet === 'Settings') {
	            const row = (data && data[0]) ? data[0] : {};
	            setMessageSettings({
	              userId: String(row.userid || row.userId || ''),
	              password: String(row.password || ''),
	              ownerNumber: String(row.ownernumber || row.ownerNumber || '')
	            });
	        } else if (!targetSheet) {
	            setTasks(normalizeTasks(data.mainTasks)); 
	            setUsers((data.users || []).map((u: any) => ({ ...u, id: Number(u.id), isActive: String(u.isactive).toUpperCase() === 'TRUE', designation: u.designation || '' })));
	            setClients((data.clients || []).map((c: any) => ({
                ...c,
                id: Number(c.clientid || c.id || 0),
                name: String(c.clientname || c.name || ''),
                mobile: String(c.clientmobilenumber || c.mobile || '')
              })));
	            setFirms((data.firms || []).map((f: any) => ({ ...f, id: Number(f.id) }))); 
	            setCategories((data.categories || []).map((c: any) => ({ ...c, id: Number(c.id) })));
	            setActionLogs(data.actionLogs || []);
	            setRecurringTasks(data.recurringTasks || []);
	            setRecurringActions(data.recurringActions || []);
	            setTaskTemplates((data.taskTemplates || []).map((t: any) => ({ ...t, id: Number(t.id), name: String(t.name || ''), category: String(t.category || '') })));
	            if (data.settings) setSettings(data.settings);
	            if (data.messageSettings) {
	              setMessageSettings({
	                userId: String(data.messageSettings.userid || data.messageSettings.userId || ''),
	                password: String(data.messageSettings.password || ''),
	                ownerNumber: String(data.messageSettings.ownernumber || data.messageSettings.ownerNumber || '')
	              });
	            }
	        }
	        setLastSynced(new Date());
	      }
    } catch (error: any) {
      console.error("fetchData error:", error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsSyncing(false);
    }
  }, [apiUrl]);

	  const apiPost = useCallback(async (action: string, data: any, target: string) => {
    if (!apiUrl) return { success: false, error: 'No API URL' };
    setIsSyncing(true);
    const now = new Date();
    const timestamp = now.toLocaleString('en-GB').replace(',', '');
    const payloadData: Record<string, any> = {}; 

	    if (action === 'addTask') {
	        payloadData.task = data.title;
	        payloadData.assigneeid = data.assigneeId;
	        payloadData.assignee = data.assignee;
	        payloadData.assigneenumber = data.assigneeNumber || '';
          payloadData.clientid = data.clientId || '';
          payloadData.clientname = data.clientName || '';
          payloadData.clientmobilenumber = data.clientMobile || '';
          payloadData.duedate = data.dueDate || '';
	        payloadData.status = 'Not Yet Started';
	        payloadData.createdatetime = timestamp;
	        payloadData.createdby = currentUser?.name || 'System';
	    } else if (action === 'updateTask') {
	        payloadData.id = data.id;
          payloadData.task = data.title;
          payloadData.assigneeid = data.assigneeId;
          payloadData.assignee = data.assignee;
          payloadData.assigneenumber = data.assigneeNumber || '';
          payloadData.clientid = data.clientId || '';
          payloadData.clientname = data.clientName || '';
          payloadData.clientmobilenumber = data.clientMobile || '';
          payloadData.duedate = data.dueDate || '';
	        payloadData.status = data.status;
	        payloadData.lastupdated = timestamp;
	        payloadData.lastupdateremarks = data.lastUpdateRemarks;
	    } else if (action === 'saveMessageSettings') {
	        payloadData.userid = data.userId;
	        payloadData.password = data.password;
	        payloadData.ownernumber = data.ownerNumber;
	    } else {
	        payloadData.id = data.id;
	        for (const key in data) { payloadData[key.toLowerCase().replace(/ /g, '')] = data[key]; }
	    }

    const payload = { action, target, data: payloadData, user: currentUser?.name || 'Unknown' };
    try {
      const cleanApiUrl = apiUrl.trim().split('?')[0];
      const response = await fetch(cleanApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      const result = await safeJsonParse(response, action);
      if (result.success) {
          fetchData(false, target);
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err.message }; 
    } finally {
      setIsSyncing(false);
    }
  }, [apiUrl, currentUser, fetchData]);

  useEffect(() => {
    if (apiUrl && currentUser) {
      fetchData();
      const interval = setInterval(() => fetchData(false, 'Tasks'), AUTO_SYNC_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [fetchData, apiUrl, currentUser]);

  const handleLogin = async (id: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const fetchHelper = async (baseUrl: string, action?: string, params: Record<string, string> = {}) => {
          const urlObj = new URL(baseUrl.trim());
          if (action) urlObj.searchParams.set('action', action);
          Object.entries(params).forEach(([k, v]) => urlObj.searchParams.set(k, v));
          const response = await fetch(urlObj.toString(), { mode: 'cors' });
          return await safeJsonParse(response, 'Login');
      };
      const regData = await fetchHelper(MASTER_REGISTRY_URL, undefined, { workspaceId: id.toLowerCase().trim() });
      const targetBackendUrl = regData.url || regData.BackendURL;
      const authData = await fetchHelper(targetBackendUrl, 'init');
      const user = authData.data?.users?.find((u: any) => 
          String(u.email || '').toLowerCase().trim() === email.toLowerCase().trim() && 
          String(u.password || '').trim() === String(pass || '').trim()
      );
      if (!user) return { success: false, error: "Incorrect Credentials." };
      const normalizedUser = { ...user, id: Number(user.id), isActive: String(user.isactive).toUpperCase() === 'TRUE' }; 
      setCurrentUser(normalizedUser);
      setApiUrl(targetBackendUrl);
      localStorage.setItem('taskpro_user', JSON.stringify(normalizedUser));
      localStorage.setItem('taskpro_workspace_id', id);
      localStorage.setItem('taskpro_api_url', targetBackendUrl);
      setActiveTab('dashboard');
      return { success: true };
    } catch (err: any) { 
        return { success: false, error: "Connection Failed." }; 
    } finally { setIsLoading(false); }
  };

  const handleAddTaskOptimistic = async (taskData: any) => {
    const tempId = String(-Date.now()); 
    const tempTask: Task = { 
        ...taskData, 
        id: tempId, 
        date: new Date().toLocaleString('en-GB'), 
        dueDate: formatToIndianDate(taskData.dueDate || ''),
        status: 'Not Yet Started',
        createdBy: currentUser?.name || 'System',
        lastUpdateDate: '',
        lastUpdateRemarks: ''
    };
    setTasks(prev => [tempTask, ...prev]);
    setSyncingIds(prev => new Set(prev).add(tempId));
    try { 
        await apiPost('addTask', taskData, 'Tasks'); 
    } catch (err) { 
        setTasks(prev => prev.filter(t => t.id !== tempId)); 
    } finally { 
        setSyncingIds(prev => { 
            const next = new Set(prev); 
            next.delete(tempId); 
            return next; 
        }); 
    }
  };

  const handleBulkAddTask = async (tasksList: any[]) => {
    // Show them immediately in UI
    const now = new Date().toLocaleString('en-GB');
    const newTasks: Task[] = tasksList.map((t, i) => ({
      ...t,
      id: String(-(Date.now() + i)),
      date: now,
      status: 'Not Yet Started',
      createdBy: currentUser?.name || 'System',
      lastUpdateDate: '',
      lastUpdateRemarks: ''
    }));
    
    setTasks(prev => [...newTasks, ...prev]);
    
    // Upload them one by one to sheet
    for (const t of tasksList) {
      await apiPost('addTask', t, 'Tasks');
    }
    setActiveTab('all-tasks');
  };

  const handleUpdateTaskOptimistic = async (task: Task) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === task.id ? task : t)); 
    setSyncingIds(prev => new Set(prev).add(task.id));
    try { 
        await apiPost('updateTask', task, 'Tasks'); 
    } catch (err) {
        setTasks(prevTasks);
    } finally { 
        setSyncingIds(prev => { 
            const next = new Set(prev); 
            next.delete(task.id); 
            return next; 
        }); 
    }
  };

  const handleEditTaskOptimistic = async (task: Task) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...task, dueDate: formatToIndianDate(task.dueDate || '') } : t)); 
    setSyncingIds(prev => new Set(prev).add(task.id));
    try { 
        await apiPost('updateTask', { ...task, skipLog: true }, 'Tasks'); 
    } catch (err) {
        setTasks(prevTasks);
    } finally { 
        setSyncingIds(prev => { 
            const next = new Set(prev); 
            next.delete(task.id); 
            return next; 
        }); 
    }
  };

  const handleAddUserOptimistic = async (userData: any) => {
    const tempId = -Date.now();
    const tempUser: User = { ...userData, id: tempId };
    setUsers(prev => [...prev, tempUser]);
    try {
      await apiPost('addMaster', userData, 'Users');
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id !== tempId));
    }
  };

  const handleAddClientOptimistic = async (clientData: Omit<Client, 'id'>) => {
    const tempId = -Date.now();
    const tempClient: Client = { ...clientData, id: tempId };
    setClients(prev => [tempClient, ...prev]);
    const result = await apiPost('addMaster', clientData, 'Client');
    if (!result?.success) {
      setClients(prev => prev.filter(client => client.id !== tempId));
      return result;
    }
    const createdId = Number(result.data?.id || result.id || tempId);
    setClients(prev => prev.map(client => client.id === tempId ? { ...client, id: createdId } : client));
    return result;
  };

  const isAdmin = currentUser?.role === 'Admin';
  
  // Implemented visibility logic: Admin sees all, Employees see rows where they are Assignee or Creator
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return tasks;
    
    const userName = currentUser.name.toLowerCase().trim();
    return tasks.filter(t => {
      const matchesAssignee = t.assignee && t.assignee.toLowerCase().trim() === userName;
      const matchesCreator = t.createdBy && t.createdBy.toLowerCase().trim() === userName;
      return matchesAssignee || matchesCreator;
    });
  }, [tasks, isAdmin, currentUser]);

  const handleDashboardFilter = (type: string, value: string) => {
    if (type === 'assignee-pending') {
        setFilterAssignee(value);
        setFilterStatus('All Status');
        setDateFrom('');
        setDateTo('');
        setLastUpdateFrom('');
        setLastUpdateTo('');
        setActiveTab('pending');
    } else if (type === 'assignee-today') {
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        setFilterAssignee(value);
        setLastUpdateFrom(todayStr);
        setLastUpdateTo(todayStr);
        setFilterStatus('All Status');
        setDateFrom('');
        setDateTo('');
        setActiveTab('all-tasks');
    }
  };

  const commonTaskProps = useMemo(() => ({
    users, categories, clients, firms, syncingIds, currentUser, taskTemplates,
    filterStatus, setFilterStatus, filterPriority, setFilterPriority, 
    filterClient, setFilterClient, filterOwner, setFilterOwner, filterAssignee, setFilterAssignee, 
    dateFrom, setDateFrom, dateTo, setDateTo, lastUpdateFrom, setLastUpdateFrom, lastUpdateTo, setLastUpdateTo, searchTerm, setSearchTerm,
    onOpenUpdateModal: (task: Task) => { setSelectedTaskForUpdate(task); setIsUpdateTaskModalOpen(true); },
    onEditTask: (task: Task) => { setSelectedTaskForEdit(task); setIsEditTaskModalOpen(true); }, 
    onDeleteTask: (id: string | number) => { setTasks(prev => prev.filter(t => t.id !== id)); apiPost('deleteRecord', { id }, 'Tasks'); }, 
    onViewHistory: (task: Task) => { setSelectedTaskForHistory(task); setIsHistoryModalOpen(true); },
    onAddTask: () => setIsTaskModalOpen(true), 
    onAddCategory: () => setIsCategoryModalOpen(true), 
    onAddClient: () => setIsAddClientModalOpen(true), 
    onAddFirm: () => setIsFirmModalOpen(true), 
    onExportExcel: (tasksToExport: Task[]) => { console.log('Export', tasksToExport.length); },
    onBulkUpdateTask: async (ids: (string | number)[], updates: any) => {
        setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
        for (const id of ids) {
            const task = tasks.find(t => t.id === id);
            if (task) await apiPost('updateTask', { ...task, ...updates }, 'Tasks');
        }
    }
  }), [users, categories, clients, firms, syncingIds, currentUser, taskTemplates, filterStatus, filterPriority, filterClient, filterOwner, filterAssignee, dateFrom, dateTo, lastUpdateFrom, lastUpdateTo, searchTerm, tasks, apiPost]);

	  const navItems: NavItem[] = useMemo(() => [
	    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
	    { id: 'all-tasks', label: 'All Tasks', icon: <CheckSquare size={20} />, section: 'Tasks' },
	    { id: 'kanban', label: 'Kanban View', icon: <Trello size={20} />, section: 'Tasks' },
	    { id: 'pending', label: 'Pending Tasks', icon: <Clock size={20} />, section: 'Tasks' },
	    { id: 'completed', label: 'Completed Tasks', icon: <CheckCircle size={20} />, section: 'Tasks' },
	    { id: 'users', label: 'Users', icon: <Users size={20} />, section: 'Master' },
	    { id: 'clients', label: 'Client Master', icon: <Building2 size={20} />, section: 'Master' },
	    { id: 'message-settings', label: 'Message Settings', icon: <MessageSquare size={20} />, section: 'Master' },
	  ], []);

  // Filtered nav items based on Admin status: hide Kanban and Users for Employees
	  const filteredNavItems = useMemo(() => {
	    return navItems.filter(item => {
	      if (item.id === 'kanban') return isAdmin;
	      if (item.id === 'users') return isAdmin;
	      if (item.id === 'clients') return isAdmin;
	      if (item.id === 'message-settings') return isAdmin;
	      return true;
	    });
	  }, [navItems, isAdmin]);

  if (!currentUser || !apiUrl) return <LoginView onLogin={handleLogin} isAuthenticating={isLoading} savedWorkspaceId={workspaceId} />;

  return (
    <div className={`flex h-screen bg-gray-50 overflow-x-hidden overflow-y-hidden flex-col origin-top-left md:[zoom:0.8] md:h-[125vh] ${layoutMode === 'side' ? 'md:flex-row' : 'md:flex-col'}`}>
      {layoutMode === 'side' ? (
        <Sidebar items={filteredNavItems} activeTab={activeTab} onTabChange={setActiveTab} onLayoutChange={setLayoutMode} layoutMode={layoutMode} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} lastSynced={lastSynced} isSyncing={isSyncing} onSync={() => fetchData()} onLogout={() => { setCurrentUser(null); localStorage.removeItem('taskpro_user'); }} onExitWorkspace={() => { setCurrentUser(null); localStorage.clear(); }} workspaceId={workspaceId} />
      ) : (
        <TopBar items={filteredNavItems} activeTab={activeTab} onTabChange={setActiveTab} onLayoutChange={setLayoutMode} layoutMode={layoutMode} lastSynced={lastSynced} isSyncing={isSyncing} onSync={() => fetchData()} />
      )}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {layoutMode === 'side' && (
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-blue-200 z-20">
            <div className="flex items-center space-x-2">
              <img src="https://i.ibb.co/gZvw6y57/CALogo-Full-Sizewo-BG.png" className="h-8 w-8" alt="Logo" />
              <h1 className="text-lg font-bold text-blue-600">TASK</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-blue-600"><Menu size={24} /></button>
          </header>
        )}
	        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col w-full">
	          <div className="flex-1">{isLoading ? (
	            <div className="w-full h-full flex items-center justify-center py-20">
	              <div className="flex flex-col items-center gap-4">
	                <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
	                <div className="font-extrabold text-indigo-600 tracking-wide">LOADING...</div>
	              </div>
	            </div>
	          ) : (
	              activeTab === 'dashboard' ? <Dashboard isAdmin={isAdmin} tasks={visibleTasks} users={users} clients={clients} actionLogs={actionLogs} recurringActions={recurringActions} onNavigate={setActiveTab} onFilterChange={handleDashboardFilter} onOpenNewTask={() => setIsTaskModalOpen(true)} onOpenAddUser={() => setIsUserModalOpen(true)} onOpenAddClient={() => setIsAddClientModalOpen(true)} /> :
	              activeTab === 'all-tasks' ? <TasksView title="All Tasks" description="View and manage all tasks" tasks={visibleTasks} actionLogs={actionLogs} {...commonTaskProps} filterType="all" hideCreationInfo={true} /> :
	              activeTab === 'kanban' ? <KanbanView tasks={visibleTasks} onUpdateTask={handleUpdateTaskOptimistic} onEditTask={(t) => { setSelectedTaskForEdit(t); setIsEditTaskModalOpen(true); }} onOpenUpdateModal={(t) => { setSelectedTaskForUpdate(t); setIsUpdateTaskModalOpen(true); }} /> :
	              activeTab === 'bulk-add' ? <BulkAddTaskView users={users} onBulkAdd={handleBulkAddTask} onCancel={() => setActiveTab('all-tasks')} /> :
	              activeTab === 'pending' ? <TasksView title="Pending Tasks" description="Tasks requiring attention" tasks={visibleTasks} actionLogs={actionLogs} {...commonTaskProps} filterType="pending" /> :
	              activeTab === 'completed' ? <TasksView title="Completed Tasks" description="Finished task history" tasks={visibleTasks} actionLogs={actionLogs} {...commonTaskProps} filterType="completed" hideCreationInfo={true} /> :
	              activeTab === 'clients' ? <ClientsView
                  clients={clients}
                  firms={firms}
                  onAddClient={handleAddClientOptimistic}
                  onEditClient={client => {
                    setClients(prev => prev.map(item => item.id === client.id ? client : item));
                    apiPost('updateMaster', client, 'Client');
                  }}
                  onDeleteClient={id => {
                    setClients(prev => prev.filter(item => item.id !== id));
                    apiPost('deleteRecord', { id }, 'Client');
                  }}
                  onAddFirm={() => setIsFirmModalOpen(true)}
                /> :
	              activeTab === 'message-settings' ? (
	                <MessageSettingsView
	                  settings={messageSettings}
	                  onSave={async (next) => {
	                    setMessageSettings(next);
	                    await apiPost('saveMessageSettings', next, 'Settings');
	                  }}
	                  onDelete={async () => {
	                    setMessageSettings({ userId: '', password: '', ownerNumber: '' });
	                    await apiPost('deleteMessageSettings', {}, 'Settings');
	                  }}
	                />
	              ) :
	              activeTab === 'users' ? <UsersView 
	                users={users} 
	                onAddUser={handleAddUserOptimistic} 
	                onEditUser={u => {
                  setUsers(prev => prev.map(user => user.id === u.id ? u : user));
                  apiPost('updateMaster', u, 'Users');
                }} 
                onToggleStatus={id => { 
                  const u = users.find(x => x.id === id); 
                  if (u) {
                    const updated = { ...u, isActive: !u.isActive };
                    setUsers(prev => prev.map(user => user.id === id ? updated : user));
                    apiPost('updateMaster', { id, isactive: updated.isActive ? 'TRUE' : 'FALSE' }, 'Users'); 
                  }
                }} 
                onDeleteUser={id => {
                  setUsers(prev => prev.filter(user => user.id !== id));
                  apiPost('deleteRecord', { id }, 'Users');
                }} 
              /> :
	              null
	          )}</div>
	          <Footer />
	        </main>
	      </div>
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleAddTaskOptimistic} users={users} categories={categories} clients={clients} firms={firms} taskTemplates={taskTemplates} onAddCategory={() => setIsCategoryModalOpen(true)} onAddClient={() => setIsAddClientModalOpen(true)} onAddFirm={() => setIsFirmModalOpen(true)} />
      {/* 
        Comment: Fixed incorrect variable name 'isEditModalOpen' to 'isEditTaskModalOpen' 
        and 'setIsEditModalOpen' to 'setIsEditTaskModalOpen' to match definitions.
      */}
      <EditTaskModal isOpen={isEditTaskModalOpen} onClose={() => setIsEditTaskModalOpen(false)} task={selectedTaskForEdit} onSave={handleEditTaskOptimistic} onAddCategory={() => setIsCategoryModalOpen(true)} onAddClient={() => setIsAddClientModalOpen(true)} onAddFirm={() => setIsFirmModalOpen(true)} users={users} categories={categories} clients={clients} firms={firms} taskTemplates={taskTemplates} />
      <UpdateTaskModal 
        isOpen={isUpdateTaskModalOpen} 
        onClose={() => setIsUpdateTaskModalOpen(false)} 
        task={selectedTaskForUpdate} 
        onUpdate={handleUpdateTaskOptimistic} 
        users={users} 
        clients={clients} 
        firms={firms} 
        actionLogs={actionLogs} 
        currentUser={currentUser} 
      />
      <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSave={c => apiPost('addMaster', c, 'Categories')} categories={categories} />
      <AddUserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleAddUserOptimistic} users={users} />
      <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onSave={handleAddClientOptimistic} clients={clients} firms={firms} onAddFirm={() => setIsFirmModalOpen(true)} />
      <TaskHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} task={selectedTaskForHistory} logs={actionLogs} />
    </div>
  );
}
