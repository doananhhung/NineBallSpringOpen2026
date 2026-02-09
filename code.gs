/**
 * ===================================================
 * MAIN API ENDPOINTS
 * Nine Ball Spring Open 2026
 * ===================================================
 * 
 * File này chứa các hàm chính để serve HTML và xử lý routing.
 * Logic Swiss algorithm và data management nằm trong swiss.gs
 */

// ============ HTML SERVING ============

/**
 * Entry point - Xử lý request GET
 * @param {Object} e - Event object chứa parameters
 */
function doGet(e) {
  const isAdmin = (e.parameter.key === 'admin123');
  const page = e.parameter.page || 'index';
  
  let template;
  
  if (page === 'admin' && isAdmin) {
    template = HtmlService.createTemplateFromFile('admin');
  } else {
    template = HtmlService.createTemplateFromFile('Index');
  }
  
  template.isAdmin = isAdmin;
  
  return template.evaluate()
    .setTitle('Nine Ball Spring Open 2026')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include file HTML khác (cho việc tách CSS/JS)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============ LEGACY API (để tương thích) ============

/**
 * [DEPRECATED] Hàm cũ - giữ lại để tương thích
 */
function getScores() {
  const config = getTournamentConfig();
  const leaderboard = getLeaderboard();
  
  if (leaderboard.length === 0) {
    return "Chưa có người chơi nào.";
  }
  
  return leaderboard.map((p, i) => 
    `${i + 1}. ${p.name} (${p.playerRank}) - W:${p.wins} L:${p.losses} +/-:${p.rackDiff}`
  ).join('\n');
}

/**
 * [DEPRECATED] Hàm cũ - không còn sử dụng
 */
function saveScores(text) {
  return "Vui lòng sử dụng Admin Panel mới.";
}

// ============ API WRAPPER FUNCTIONS ============
// Các hàm này wrap swiss.gs để expose ra frontend

/**
 * Wrapper cho client-side calls
 * Các hàm trong swiss.gs có thể gọi trực tiếp từ google.script.run
 * nhưng đặt wrapper ở đây để dễ debug và thêm logging nếu cần
 */

// Tournament
function api_getTournamentConfig() {
  return getTournamentConfig();
}

function api_setTournamentConfig(config) {
  return setTournamentConfig(config);
}

// Players
function api_getPlayers() {
  return getPlayers();
}

function api_addPlayer(name, rank) {
  return addPlayer(name, rank);
}

function api_removePlayer(playerId) {
  return removePlayer(playerId);
}

// Matches
function api_getAllMatches() {
  return getAllMatches();
}

function api_getCurrentMatches() {
  return getCurrentMatches();
}

function api_updateMatchScore(matchId, score1, score2) {
  return updateMatchScore(matchId, score1, score2);
}

function api_correctMatchScore(matchId, score1, score2) {
  return correctMatchScore(matchId, score1, score2);
}

// Swiss Pairing
function api_generatePairings() {
  return generatePairings();
}

function api_startNextRound() {
  return startNextRound();
}

// Leaderboard
function api_getLeaderboard() {
  return getLeaderboard();
}

// Tournament Control
function api_finishTournament() {
  return finishTournament();
}

function api_resetTournament() {
  return resetTournament();
}

function api_resetAll() {
  return resetAll();
}

// ============ UTILITY FUNCTIONS ============

/**
 * Lấy toàn bộ dữ liệu (cho debug)
 */
function api_getAllData() {
  return {
    config: getTournamentConfig(),
    players: getPlayers(),
    matches: getAllMatches(),
    leaderboard: getLeaderboard()
  };
}

/**
 * Kiểm tra trạng thái hệ thống
 */
function api_getStatus() {
  const config = getTournamentConfig();
  const players = getPlayers();
  const matches = getAllMatches();
  const currentMatches = getCurrentMatches();
  
  return {
    tournamentName: config.tournamentName,
    status: config.status,
    currentRound: config.currentRound,
    totalRounds: config.totalRounds,
    playerCount: players.length,
    totalMatches: matches.length,
    pendingMatches: currentMatches.filter(m => m.status === 'pending').length,
    completedMatches: currentMatches.filter(m => m.status === 'completed').length
  };
}