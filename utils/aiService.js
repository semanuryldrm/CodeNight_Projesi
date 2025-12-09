const fs = require('fs');
const path = require('path');

// Logs klasörünü oluştur
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

function writeLog(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    // DÜZELTME 1: Satır 15 backtick içine alındı
    const logLine = `[${timestamp}] [${level}] ${message}${dataStr}`;

    console.log(logLine); // Konsola yaz
    fs.appendFileSync(logFile, logLine + '\n'); // Dosyaya yaz
}

module.exports = {
    info: (msg, data) => writeLog('INFO', msg, data),
    error: (msg, data) => writeLog('ERROR', msg, data),
    warn: (msg, data) => writeLog('WARN', msg, data),
    logAICall: (type, success, details) => writeLog('AI_CALL', type, { success, ...details }),
    // DÜZELTME 2: Satır 27 `Ticket #${id}` ifadesi backtick içine alındı
    logTicketCreation: (id, userId, title) => writeLog('TICKET_CREATED', `Ticket #${id}`, { userId, title }),
    // DÜZELTME 3: Satır 28 `Ticket #${id}` ifadesi backtick içine alındı
    logTicketStatusChange: (id, old, neu, by) => writeLog('STATUS_CHANGE', `Ticket #${id}`, { old, new: neu, by })
};
