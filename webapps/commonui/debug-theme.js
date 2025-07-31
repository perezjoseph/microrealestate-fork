import { createThemeStorage } from './utils/themeStorage.js';

const themeStorage = createThemeStorage({
  enableAuditLog: true,
  enableValidation: true,
  enableSanitization: true
});

console.log('Testing theme sanitization...');

const testCases = [
  '  LIGHT  ',
  'Dark',
  'light<script>'
];

testCases.forEach(testCase => {
  console.log(`\nTesting: "${testCase}"`);
  const result = themeStorage.validateAndSanitizeTheme(testCase);
  console.log(`Result: "${result}"`);
  
  // Get audit log for this operation
  const auditLog = themeStorage.getAuditLog();
  const lastEntry = auditLog[auditLog.length - 1];
  if (lastEntry) {
    console.log('Last audit entry:', lastEntry);
  }
});