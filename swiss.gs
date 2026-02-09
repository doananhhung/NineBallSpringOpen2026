/**
 * ===================================================
 * SWISS PAIRING ALGORITHM & DATA HELPERS
 * Nine Ball Spring Open 2026
 * ===================================================
 */

// ============ CONSTANTS ============
const STORAGE_KEYS = {
  TOURNAMENT: 'TOURNAMENT_CONFIG',
  PLAYERS: 'PLAYERS_DATA',
  MATCHES: 'MATCHES_DATA'
};

const DEFAULT_BYE_RACKS = 7; // Số rack thắng khi được BYE

// ============ DATA HELPERS ============

/**
 * Lấy dữ liệu từ PropertiesService
 */
function getData(key) {
  const data = PropertiesService.getScriptProperties().getProperty(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Lưu dữ liệu vào PropertiesService
 */
function saveData(key, data) {
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(data));
}

/**
 * Tạo ID ngẫu nhiên
 */
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// ============ TOURNAMENT CONFIG ============

/**
 * Lấy config giải đấu
 */
function getTournamentConfig() {
  return getData(STORAGE_KEYS.TOURNAMENT) || {
    tournamentName: 'Nine Ball Spring Open 2026',
    totalRounds: 5,
    currentRound: 0,
    status: 'registration' // registration | ongoing | finished
  };
}

/**
 * Cập nhật config giải đấu
 * Cho phép tăng số vòng giữa chừng (nhưng không giảm dưới vòng hiện tại)
 */
function setTournamentConfig(config) {
  const currentConfig = getTournamentConfig();
  
  // Validation: totalRounds phải >= currentRound
  if (config.totalRounds < currentConfig.currentRound) {
    throw new Error('Số vòng không thể nhỏ hơn vòng hiện tại (' + currentConfig.currentRound + ')');
  }
  
  // Nếu giải đã kết thúc nhưng tăng số vòng → mở lại giải đấu
  if (currentConfig.status === 'finished' && config.totalRounds > currentConfig.totalRounds) {
    config.status = 'ongoing';
  }
  
  saveData(STORAGE_KEYS.TOURNAMENT, config);
  return config;
}

// ============ PLAYER MANAGEMENT ============

/**
 * Lấy danh sách người chơi
 */
function getPlayers() {
  return getData(STORAGE_KEYS.PLAYERS) || [];
}

/**
 * Thêm người chơi mới
 */
function addPlayer(name, rank) {
  if (!name || !name.trim()) {
    throw new Error('Tên không được để trống');
  }
  
  const players = getPlayers();
  
  if (players.length >= 32) {
    throw new Error('Đã đạt giới hạn 32 người chơi');
  }
  
  const newPlayer = {
    id: generateId(),
    name: name.trim(),
    rank: rank || 'N/A',
    wins: 0,
    losses: 0,
    rackWon: 0,
    rackLost: 0,
    rackDiff: 0,
    matchHistory: []
  };
  
  players.push(newPlayer);
  saveData(STORAGE_KEYS.PLAYERS, players);
  
  return newPlayer;
}

/**
 * Xoá người chơi
 */
function removePlayer(playerId) {
  const config = getTournamentConfig();
  if (config.status !== 'registration') {
    throw new Error('Chỉ có thể xoá người chơi khi giải đấu chưa bắt đầu');
  }
  
  let players = getPlayers();
  players = players.filter(p => p.id !== playerId);
  saveData(STORAGE_KEYS.PLAYERS, players);
  
  return true;
}

/**
 * Cập nhật thống kê người chơi sau trận đấu
 */
function updatePlayerStats(playerId, rackWon, rackLost, opponentId, isWinner) {
  const players = getPlayers();
  const player = players.find(p => p.id === playerId);
  
  if (!player) return;
  
  if (isWinner) {
    player.wins++;
  } else {
    player.losses++;
  }
  
  player.rackWon += rackWon;
  player.rackLost += rackLost;
  player.rackDiff = player.rackWon - player.rackLost;
  
  if (opponentId && !player.matchHistory.includes(opponentId)) {
    player.matchHistory.push(opponentId);
  }
  
  saveData(STORAGE_KEYS.PLAYERS, players);
}

// ============ MATCH MANAGEMENT ============

/**
 * Lấy tất cả trận đấu
 */
function getAllMatches() {
  return getData(STORAGE_KEYS.MATCHES) || [];
}

/**
 * Lấy trận đấu theo vòng
 */
function getMatchesByRound(round) {
  const matches = getAllMatches();
  return matches.filter(m => m.round === round);
}

/**
 * Lấy trận đấu hiện tại (vòng đang diễn ra)
 */
function getCurrentMatches() {
  const config = getTournamentConfig();
  return getMatchesByRound(config.currentRound);
}

/**
 * Cập nhật tỉ số trận đấu
 */
function updateMatchScore(matchId, score1, score2) {
  const matches = getAllMatches();
  const match = matches.find(m => m.id === matchId);
  
  if (!match) {
    throw new Error('Không tìm thấy trận đấu');
  }
  
  if (match.status === 'completed') {
    throw new Error('Trận đấu đã kết thúc');
  }
  
  score1 = parseInt(score1);
  score2 = parseInt(score2);
  
  if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
    throw new Error('Tỉ số không hợp lệ');
  }
  
  if (score1 === score2) {
    throw new Error('Tỉ số không được bằng nhau');
  }
  
  match.score1 = score1;
  match.score2 = score2;
  match.winner = score1 > score2 ? match.player1Id : match.player2Id;
  match.status = 'completed';
  
  saveData(STORAGE_KEYS.MATCHES, matches);
  
  // Cập nhật stats cho cả 2 người chơi
  updatePlayerStats(match.player1Id, score1, score2, match.player2Id, match.winner === match.player1Id);
  updatePlayerStats(match.player2Id, score2, score1, match.player1Id, match.winner === match.player2Id);
  
  return match;
}

/**
 * Sửa tỉ số trận đấu đã hoàn thành (hoàn tác stats cũ, áp dụng stats mới)
 */
function correctMatchScore(matchId, newScore1, newScore2) {
  const matches = getAllMatches();
  const match = matches.find(m => m.id === matchId);
  
  if (!match) {
    throw new Error('Không tìm thấy trận đấu');
  }
  
  if (match.status !== 'completed') {
    throw new Error('Chỉ có thể sửa trận đấu đã hoàn thành');
  }
  
  if (match.isBye) {
    throw new Error('Không thể sửa trận BYE');
  }
  
  newScore1 = parseInt(newScore1);
  newScore2 = parseInt(newScore2);
  
  if (isNaN(newScore1) || isNaN(newScore2) || newScore1 < 0 || newScore2 < 0) {
    throw new Error('Tỉ số không hợp lệ');
  }
  
  if (newScore1 === newScore2) {
    throw new Error('Tỉ số không được bằng nhau');
  }
  
  const players = getPlayers();
  const oldScore1 = match.score1;
  const oldScore2 = match.score2;
  const oldWinner = match.winner;
  const newWinner = newScore1 > newScore2 ? match.player1Id : match.player2Id;
  
  // Hoàn tác stats cũ cho player1
  const player1 = players.find(p => p.id === match.player1Id);
  if (player1) {
    if (oldWinner === match.player1Id) {
      player1.wins--;
    } else {
      player1.losses--;
    }
    player1.rackWon -= oldScore1;
    player1.rackLost -= oldScore2;
    player1.rackDiff = player1.rackWon - player1.rackLost;
  }
  
  // Hoàn tác stats cũ cho player2
  const player2 = players.find(p => p.id === match.player2Id);
  if (player2) {
    if (oldWinner === match.player2Id) {
      player2.wins--;
    } else {
      player2.losses--;
    }
    player2.rackWon -= oldScore2;
    player2.rackLost -= oldScore1;
    player2.rackDiff = player2.rackWon - player2.rackLost;
  }
  
  // Áp dụng stats mới cho player1
  if (player1) {
    if (newWinner === match.player1Id) {
      player1.wins++;
    } else {
      player1.losses++;
    }
    player1.rackWon += newScore1;
    player1.rackLost += newScore2;
    player1.rackDiff = player1.rackWon - player1.rackLost;
  }
  
  // Áp dụng stats mới cho player2
  if (player2) {
    if (newWinner === match.player2Id) {
      player2.wins++;
    } else {
      player2.losses++;
    }
    player2.rackWon += newScore2;
    player2.rackLost += newScore1;
    player2.rackDiff = player2.rackWon - player2.rackLost;
  }
  
  // Cập nhật match
  match.score1 = newScore1;
  match.score2 = newScore2;
  match.winner = newWinner;
  
  // Lưu dữ liệu
  saveData(STORAGE_KEYS.MATCHES, matches);
  saveData(STORAGE_KEYS.PLAYERS, players);
  
  return match;
}

// ============ SWISS PAIRING ALGORITHM ============

/**
 * Shuffle array ngẫu nhiên (Fisher-Yates)
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sắp xếp người chơi theo thứ hạng (Wins DESC, RackDiff DESC)
 */
function sortPlayersByStanding(players) {
  return [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.rackDiff - a.rackDiff;
  });
}

/**
 * Tạo cặp đấu cho vòng tiếp theo
 */
function generatePairings() {
  const config = getTournamentConfig();
  const players = getPlayers();
  
  if (players.length < 2) {
    throw new Error('Cần ít nhất 2 người chơi');
  }
  
  // Kiểm tra vòng hiện tại đã hoàn thành chưa
  if (config.currentRound > 0) {
    const currentMatches = getCurrentMatches();
    const pendingMatches = currentMatches.filter(m => m.status === 'pending');
    if (pendingMatches.length > 0) {
      throw new Error('Vẫn còn trận đấu chưa hoàn thành ở vòng ' + config.currentRound);
    }
  }
  
  // Kiểm tra đã hết số vòng chưa
  if (config.currentRound >= config.totalRounds) {
    throw new Error('Giải đấu đã kết thúc');
  }
  
  const nextRound = config.currentRound + 1;
  let sortedPlayers;
  
  // Vòng 1: shuffle ngẫu nhiên, Vòng 2+: sắp xếp theo thứ hạng
  if (nextRound === 1) {
    sortedPlayers = shuffleArray(players);
  } else {
    sortedPlayers = sortPlayersByStanding(players);
  }
  
  const matches = getAllMatches();
  const newMatches = [];
  
  // Ghép cặp theo thứ tự
  for (let i = 0; i < sortedPlayers.length - 1; i += 2) {
    const player1 = sortedPlayers[i];
    const player2 = sortedPlayers[i + 1];
    
    newMatches.push({
      id: generateId(),
      round: nextRound,
      player1Id: player1.id,
      player2Id: player2.id,
      player1Name: player1.name,
      player2Name: player2.name,
      score1: null,
      score2: null,
      winner: null,
      status: 'pending',
      isBye: false
    });
  }
  
  // Xử lý BYE nếu số lẻ
  if (sortedPlayers.length % 2 === 1) {
    const byePlayer = sortedPlayers[sortedPlayers.length - 1];
    
    // Tạo trận BYE (auto-win, không cộng rack để công bằng)
    const byeMatch = {
      id: generateId(),
      round: nextRound,
      player1Id: byePlayer.id,
      player2Id: null,
      player1Name: byePlayer.name,
      player2Name: 'BYE',
      score1: 0,  // Không cộng rack
      score2: 0,
      winner: byePlayer.id,
      status: 'completed',
      isBye: true
    };
    
    newMatches.push(byeMatch);
    
    // Cập nhật stats cho người được BYE: chỉ +1 Win, không cộng Rack
    updatePlayerStats(byePlayer.id, 0, 0, null, true);
  }
  
  // Lưu matches và cập nhật config
  saveData(STORAGE_KEYS.MATCHES, [...matches, ...newMatches]);
  
  config.currentRound = nextRound;
  if (config.status === 'registration') {
    config.status = 'ongoing';
  }
  setTournamentConfig(config);
  
  return newMatches;
}

// ============ LEADERBOARD ============

/**
 * Lấy bảng xếp hạng
 */
function getLeaderboard() {
  const players = getPlayers();
  const sorted = sortPlayersByStanding(players);
  
  return sorted.map((player, index) => ({
    rank: index + 1,
    id: player.id,
    name: player.name,
    playerRank: player.rank,
    wins: player.wins,
    losses: player.losses,
    rackWon: player.rackWon,
    rackLost: player.rackLost,
    rackDiff: player.rackDiff
  }));
}

// ============ TOURNAMENT CONTROL ============

/**
 * Bắt đầu vòng tiếp theo (alias cho generatePairings)
 */
function startNextRound() {
  return generatePairings();
}

/**
 * Kết thúc giải đấu
 */
function finishTournament() {
  const config = getTournamentConfig();
  config.status = 'finished';
  setTournamentConfig(config);
  return config;
}

/**
 * Reset toàn bộ giải đấu
 */
function resetTournament() {
  const config = getTournamentConfig();
  
  // Reset config
  config.currentRound = 0;
  config.status = 'registration';
  setTournamentConfig(config);
  
  // Reset players stats
  const players = getPlayers();
  players.forEach(p => {
    p.wins = 0;
    p.losses = 0;
    p.rackWon = 0;
    p.rackLost = 0;
    p.rackDiff = 0;
    p.matchHistory = [];
  });
  saveData(STORAGE_KEYS.PLAYERS, players);
  
  // Clear all matches
  saveData(STORAGE_KEYS.MATCHES, []);
  
  return true;
}

/**
 * Reset toàn bộ dữ liệu (bao gồm cả người chơi)
 */
function resetAll() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  return true;
}
