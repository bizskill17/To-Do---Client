import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  onClick?: () => void;
}

export interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

export interface Task {
  id: string | number; // Support hex strings or numeric IDs
  title: string;
  assigneeId: string;
  assignee: string;
  assigneeNumber?: string;
  clientId?: string | number;
  clientName?: string;
  clientMobile?: string;
  status: string;
  date: string; // Create Date/Time
  createdBy: string;
  lastUpdateDate: string; // Last Updated
  lastUpdateRemarks: string; // Last Update Remarks
  dueDate?: string;
  billingApplicable?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  hoursTaken?: number;
  billingRate?: number;
  firmToBill?: string;
  clientName?: string;
  owner?: string;
  assignees?: string;
  category?: string;
  billable?: string;
  billingStatus?: string;
  priority?: string;
  teamMembers?: string;
  skipLog?: boolean;
}

export interface TaskUpdatePayload extends Partial<Task> {
  skipLog?: boolean; 
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  designation: string; 
  role: string;
  isActive: boolean;
  telegramUserName?: string;
  password?: string; 
}

export interface Category {
    id: string | number;
    name: string;
}

export interface StatusOption {
    id: string | number;
    name: string;
}

export interface Client {
    id: number;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    telegramGroupId?: string;
    whatsappGroupId?: string;
    billingRate?: number;
    firmToBill?: string;
}

export interface Firm {
    id: number;
    name: string;
    gstNumber?: string;
    address?: string;
    email?: string;
    mobile?: string;
}

export interface ActionLogEntry {
    id: number;
    taskId: string | number;
    task: string; 
    taskDate: string;
    updateDate: string;
    status: string;
    remarks: string;
    assignee: string; 
    assignees?: string;
    owner?: string;
    clientName?: string;
    hoursTaken?: number;
    updaterName?: string; 
    updaterDesignation?: string;
}

export interface AppSettings {
  officeTokenId: string;
  officeTelegramGroupId: string;
  whatsappGroupId: string;
  masId: string;
  masPassword: string;
  metaAccessToken: string;
  metaPhoneNumberId: string;
  metaWabaId: string;
  metaVerifyToken: string;
}

export interface MessageSettings {
  userId: string;
  password: string;
  ownerNumber: string;
}

export interface TaskTemplate {
  id: number;
  name: string; 
  category: string; 
}

export interface Project {
    id: number;
    name: string;
    client: string;
    status: string;
    telegramGroupId?: string;
    whatsappGroupId?: string;
    projectEmail?: string;
}

export interface Vendor {
    id: number;
    name: string;
    email: string;
    mobile: string;
    address: string;
    gstNumber?: string;
}

export interface VendorCategory {
    id: number;
    name: string;
}

export interface RecurringTask {
    id: number;
    title: string;
    category: string;
    assignee: string;
    clientName: string;
    frequencyDays: number;
    startDate: string;
    periodicity: 'Fixed Days' | 'Weekly' | 'Monthly' | 'Yearly';
    recurrenceDay?: number;
    recurrenceMonth?: string;
    status?: string;
    lastUpdatedOn?: string;
    lastUpdateRemarks?: string;
}

export interface RecurringTaskAction {
    id: number;
    taskId: number;
    taskTitle: string;
    updatedOn: string;
    status: string;
    remarks: string;
    clientName?: string;
    assignee: string;
    category: string;
    timestamp?: string;
}
