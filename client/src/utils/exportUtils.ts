import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Project } from '@shared/schema';

// Type for export format options
export type ExportFormat = 'pdf' | 'csv' | 'excel';

/**
 * Formats the date for display in reports
 */
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate PDF from project data
 */
export const exportToPDF = (project: Project, includeDetails: boolean = true): void => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(29, 144, 219); // #1E90DB
  doc.text('Project Report', 105, 15, { align: 'center' });
  
  // Project title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(project.title, 105, 25, { align: 'center' });
  
  // Basic project info
  doc.setFontSize(12);
  doc.text(`Client: ${project.client || 'N/A'}`, 14, 40);
  doc.text(`Location: ${project.location || 'N/A'}`, 14, 50);
  doc.text(`Category: ${project.category || 'N/A'}`, 14, 60);
  doc.text(`Created: ${formatDate(project.createdAt)}`, 14, 70);
  doc.text(`Completion Date: ${project.completionDate || 'N/A'}`, 14, 80);
  doc.text(`Size: ${project.size || 'N/A'}`, 14, 90);
  
  // Project description
  if (includeDetails && project.description) {
    doc.setFontSize(14);
    doc.text('Project Description', 14, 110);
    doc.setFontSize(12);
    
    // Handle long descriptions by splitting into multiple lines
    const splitDescription = doc.splitTextToSize(project.description, 180);
    doc.text(splitDescription, 14, 120);
  }
  
  // Project overview if available
  let yPos = 140;
  if (includeDetails && project.overview) {
    doc.setFontSize(14);
    doc.text('Project Overview', 14, yPos);
    doc.setFontSize(12);
    
    const splitOverview = doc.splitTextToSize(project.overview, 180);
    doc.text(splitOverview, 14, yPos + 10);
    
    yPos += 20 + (project.overview.length / 80) * 10;
  }
  
  // Challenges and solutions if available
  if (includeDetails && project.challenges) {
    doc.setFontSize(14);
    doc.text('Challenges & Solutions', 14, yPos);
    doc.setFontSize(12);
    
    const splitChallenges = doc.splitTextToSize(project.challenges, 180);
    doc.text(splitChallenges, 14, yPos + 10);
    
    yPos += 20 + (project.challenges.length / 80) * 10;
  }
  
  // Results if available
  if (includeDetails && project.results) {
    doc.setFontSize(14);
    doc.text('Results', 14, yPos);
    doc.setFontSize(12);
    
    const splitResults = doc.splitTextToSize(project.results, 180);
    doc.text(splitResults, 14, yPos + 10);
  }
  
  // Add footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Report generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      105, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
};

/**
 * Export project data to CSV
 */
export const exportToCSV = (project: Project): void => {
  // Format project data for CSV
  const projectData = {
    'Project Title': project.title,
    'Client': project.client || '',
    'Location': project.location || '',
    'Category': project.category || '',
    'Size': project.size || '',
    'Creation Date': formatDate(project.createdAt),
    'Completion Date': project.completionDate || '',
    'Services Provided': project.servicesProvided || '',
    'Description': project.description || '',
    'Overview': project.overview || '',
    'Challenges & Solutions': project.challenges || '',
    'Results': project.results || '',
    'Featured': project.featured ? 'Yes' : 'No'
  };
  
  // Convert to CSV
  const worksheet = XLSX.utils.json_to_sheet([projectData]);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create a Blob and save
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv`);
};

/**
 * Export project data to Excel
 */
export const exportToExcel = (project: Project): void => {
  // Format project data for Excel
  const projectData = {
    'Project Title': project.title,
    'Client': project.client || '',
    'Location': project.location || '',
    'Category': project.category || '',
    'Size': project.size || '',
    'Creation Date': formatDate(project.createdAt),
    'Completion Date': project.completionDate || '',
    'Services Provided': project.servicesProvided || '',
    'Description': project.description || '',
    'Overview': project.overview || '',
    'Challenges & Solutions': project.challenges || '',
    'Results': project.results || '',
    'Featured': project.featured ? 'Yes' : 'No'
  };
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet([projectData]);
  
  // Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Details');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * Export project data to the specified format
 */
export const exportProject = (project: Project, format: ExportFormat): void => {
  switch (format) {
    case 'pdf':
      exportToPDF(project);
      break;
    case 'csv':
      exportToCSV(project);
      break;
    case 'excel':
      exportToExcel(project);
      break;
    default:
      console.error(`Unsupported format: ${format}`);
  }
};

/**
 * Export multiple projects to a single file in the specified format
 */
export const exportMultipleProjects = (projects: Project[], format: ExportFormat): void => {
  if (!projects || projects.length === 0) {
    console.error('No projects provided for export');
    return;
  }
  
  switch (format) {
    case 'pdf':
      exportMultipleToPDF(projects);
      break;
    case 'csv':
      exportMultipleToCSV(projects);
      break;
    case 'excel':
      exportMultipleToExcel(projects);
      break;
    default:
      console.error(`Unsupported format: ${format}`);
  }
};

/**
 * Export multiple projects to a single PDF
 */
const exportMultipleToPDF = (projects: Project[]): void => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(29, 144, 219); // #1E90DB
  doc.text('Projects Report', 105, 15, { align: 'center' });
  
  // Current Y position tracker
  let yPos = 30;
  
  // Add each project
  projects.forEach((project, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Project title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${project.title}`, 14, yPos);
    yPos += 10;
    
    // Basic project info
    doc.setFontSize(12);
    doc.text(`Client: ${project.client || 'N/A'}`, 14, yPos); yPos += 8;
    doc.text(`Location: ${project.location || 'N/A'}`, 14, yPos); yPos += 8;
    doc.text(`Category: ${project.category || 'N/A'}`, 14, yPos); yPos += 8;
    doc.text(`Creation Date: ${formatDate(project.createdAt)}`, 14, yPos); yPos += 8;
    doc.text(`Completion Date: ${project.completionDate || 'N/A'}`, 14, yPos); yPos += 8;
    doc.text(`Size: ${project.size || 'N/A'}`, 14, yPos); yPos += 15;
    
    // Add a separator
    if (index < projects.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 5, 196, yPos - 5);
      yPos += 10;
    }
  });
  
  // Create a summary table at the end
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Projects Summary', 105, 15, { align: 'center' });
  
  const tableData = projects.map(p => [
    p.title,
    p.client || 'N/A',
    p.category || 'N/A',
    formatDate(p.createdAt),
    p.completionDate || 'N/A',
    p.size || 'N/A'
  ]);
  
  autoTable(doc, {
    startY: 25,
    head: [['Project', 'Client', 'Category', 'Created', 'Completion', 'Size']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [29, 144, 219],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  // Add footer with date to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Report generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      105, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save('projects_report.pdf');
};

/**
 * Export multiple projects to a single CSV file
 */
const exportMultipleToCSV = (projects: Project[]): void => {
  // Format each project for CSV
  const projectsData = projects.map(project => ({
    'Project Title': project.title,
    'Client': project.client || '',
    'Location': project.location || '',
    'Category': project.category || '',
    'Size': project.size || '',
    'Creation Date': formatDate(project.createdAt),
    'Completion Date': project.completionDate || '',
    'Services Provided': project.servicesProvided || '',
    'Description': project.description ? project.description.substring(0, 100) + '...' : '',
    'Featured': project.featured ? 'Yes' : 'No'
  }));
  
  // Convert to CSV
  const worksheet = XLSX.utils.json_to_sheet(projectsData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create a Blob and save
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, 'projects_report.csv');
};

/**
 * Export multiple projects to a single Excel file
 */
const exportMultipleToExcel = (projects: Project[]): void => {
  // Format projects data for Excel
  const projectsData = projects.map(project => ({
    'Project Title': project.title,
    'Client': project.client || '',
    'Location': project.location || '',
    'Category': project.category || '',
    'Size': project.size || '',
    'Creation Date': formatDate(project.createdAt),
    'Completion Date': project.completionDate || '',
    'Services Provided': project.servicesProvided || '',
    'Description': project.description ? project.description.substring(0, 100) + '...' : '',
    'Featured': project.featured ? 'Yes' : 'No'
  }));
  
  // Create a projects worksheet
  const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
  
  // Create a workbook and add the projects sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, 'projects_report.xlsx');
};