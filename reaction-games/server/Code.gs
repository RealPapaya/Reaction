/*
 * Google Apps Script for Reaction Games Leaderboard
 * Deploy as Web App:
 * 1. Click "Deploy" > "New deployment"
 * 2. Select type "Web app"
 * 3. Description: "v1"
 * 4. Execute as: "Me" (your account)
 * 5. Who has access: "Anyone" (IMPORTANT for game access)
 */

const SHEET_NAME = 'Scores';
const MAX_SCORES_RETURNED = 10;

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // CORS Support
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const params = e.parameter;
    const action = params.action || (e.postData ? 'submit' : 'get');
    
    const ss = SpreadsheetApp.openById('1heFbfoprCLFNZfNEEW-X4Uvk7NZNpcWOz6FyHh8Ircc');
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Timestamp', 'GameID', 'PlayerName', 'Score']);
    }

    if (action === 'submit') {
      // POST Request: Submit Score
      // Expecting JSON payload in postData
      let data;
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback to parameters if not JSON
        data = params; 
      }
      
      const gameId = data.gameId;
      const name = data.name;
      const score = Number(data.score);
      
      if (!gameId || !name || isNaN(score)) {
        throw new Error('Missing required fields: gameId, name, score');
      }
      
      // Append row
      sheet.appendRow([new Date(), gameId, name, score]);
      
      return response(output, { success: true, message: 'Score submitted' });
      
    } else {
      // GET Request: Get Leaderboard
      const gameId = params.gameId;
      if (!gameId) throw new Error('Missing gameId');
      
      const data = sheet.getDataRange().getValues();
      const headers = data.shift(); // Remove headers
      
      // Filter by gameId
      const scores = data
        .filter(row => row[1] === gameId)
        .map(row => ({
          name: row[2],
          score: Number(row[3]),
          date: row[0]
        }))
        // Sort descending (Standard for score). 
        // Note: For Reaction Test (time), lower is better. 
        // We might need a sortOrder param or game specific logic.
        // Let's support sortOrder=asc or desc. Default desc.
        .sort((a, b) => {
          if (gameId === 'reaction-test') {
             return a.score - b.score; // Lower is better (Time)
          }
          return b.score - a.score; // Higher is better (Points)
        });
      
      return response(output, { 
        success: true, 
        leaderboard: scores.slice(0, MAX_SCORES_RETURNED) 
      });
    }
    
  } catch (error) {
    return response(output, { success: false, error: error.toString() });
  }
}

function response(output, data) {
  return output.setContent(JSON.stringify(data));
}

function setup() {
  const ss = SpreadsheetApp.openById('1heFbfoprCLFNZfNEEW-X4Uvk7NZNpcWOz6FyHh8Ircc');
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    ss.insertSheet(SHEET_NAME).appendRow(['Timestamp', 'GameID', 'PlayerName', 'Score']);
    Logger.log('Score sheet created');
  }
}
