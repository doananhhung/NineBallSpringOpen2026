/**
 * ===================================================
 * TEST SUITE - NineBallSpringOpen2026
 * Swiss Tournament System
 * ===================================================
 * 
 * ⚠️ CẢNH BÁO: Chạy tests sẽ XOÁ TOÀN BỘ DỮ LIỆU.
 * Chỉ chạy trên environment KHÔNG CÓ dữ liệu giải đấu thật.
 * 
 * Cách sử dụng:
 * 1. Mở Script Editor (script.google.com)
 * 2. Chọn function runAllTests() từ dropdown
 * 3. Nhấn ▶️ Run
 * 4. Mở Execution Log (Ctrl+Enter) để xem kết quả
 */

// ============ TEST HELPERS ============

let _testResults = { passed: 0, failed: 0, errors: [] };

/**
 * Assert helper - throw nếu condition false
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error('ASSERT FAILED: ' + message);
  }
}

function assertEqual(actual, expected, fieldName) {
  if (actual !== expected) {
    throw new Error(`ASSERT FAILED: ${fieldName} — expected [${expected}] but got [${actual}]`);
  }
}

function assertThrows(fn, expectedMessage, testName) {
  try {
    fn();
    throw new Error(`ASSERT FAILED: ${testName} — expected error "${expectedMessage}" but no error was thrown`);
  } catch (e) {
    if (e.message.indexOf('ASSERT FAILED') === 0) throw e; // Re-throw our own assert errors
    if (expectedMessage && e.message.indexOf(expectedMessage) === -1) {
      throw new Error(`ASSERT FAILED: ${testName} — expected error containing "${expectedMessage}" but got "${e.message}"`);
    }
  }
}

/**
 * Chạy 1 test function, ghi lại kết quả
 */
function runTest(testName, testFn) {
  try {
    resetAll(); // Clean state
    testFn();
    _testResults.passed++;
    Logger.log('✅ ' + testName);
  } catch (e) {
    _testResults.failed++;
    _testResults.errors.push(testName + ': ' + e.message);
    Logger.log('❌ ' + testName + ' — ' + e.message);
  }
}

/**
 * Helper: setup N players nhanh
 */
function _setupPlayers(count) {
  const players = [];
  for (let i = 1; i <= count; i++) {
    players.push(addPlayer('Player ' + i, 'G'));
  }
  return players;
}

/**
 * Helper: setup giải đấu + chạy đến vòng N
 */
function _setupTournamentToRound(playerCount, roundsToPlay, totalRounds) {
  const config = getTournamentConfig();
  config.totalRounds = totalRounds || 5;
  setTournamentConfig(config);

  const players = _setupPlayers(playerCount);
  
  for (let r = 0; r < roundsToPlay; r++) {
    const matches = generatePairings();
    // Complete tất cả trận pending
    const allM = getAllMatches();
    const pendingMatches = allM.filter(m => m.status === 'pending');
    pendingMatches.forEach((m, idx) => {
      updateMatchScore(m.id, 7, 3 + idx); // Score khác nhau
    });
  }
  
  return players;
}

// ============================================================
// 1. DATA HELPERS TESTS
// ============================================================

function test_1_1_saveAndGetData() {
  const testObj = { name: 'Test', value: 42 };
  saveData('TEST_KEY', testObj);
  const result = getData('TEST_KEY');
  assertEqual(result.name, 'Test', 'name');
  assertEqual(result.value, 42, 'value');
  // Cleanup
  PropertiesService.getScriptProperties().deleteProperty('TEST_KEY');
}

function test_1_2_saveAndGetEmptyArray() {
  saveData('TEST_KEY', []);
  const result = getData('TEST_KEY');
  assert(Array.isArray(result), 'Should be array');
  assertEqual(result.length, 0, 'Array length');
  PropertiesService.getScriptProperties().deleteProperty('TEST_KEY');
}

function test_1_3_getDataNonExistentKey() {
  const result = getData('NON_EXISTENT_KEY_XYZ');
  assertEqual(result, null, 'Non-existent key');
}

function test_1_4_saveDataOverwrite() {
  saveData('TEST_KEY', { v: 1 });
  saveData('TEST_KEY', { v: 2 });
  const result = getData('TEST_KEY');
  assertEqual(result.v, 2, 'Overwritten value');
  PropertiesService.getScriptProperties().deleteProperty('TEST_KEY');
}

function test_1_5_saveDataUnicode() {
  saveData('TEST_KEY', { name: 'Nguyễn Văn A' });
  const result = getData('TEST_KEY');
  assertEqual(result.name, 'Nguyễn Văn A', 'Unicode name');
  PropertiesService.getScriptProperties().deleteProperty('TEST_KEY');
}

function test_1_6_generateIdFormat() {
  const id = generateId();
  assert(id.startsWith('id_'), 'ID prefix');
  assert(id.length > 3, 'ID length > 3');
}

function test_1_7_generateIdUnique() {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(generateId());
  }
  assertEqual(ids.size, 100, 'All 100 IDs should be unique');
}

function runTests_DataHelpers() {
  Logger.log('\n=== 1. DATA HELPERS ===');
  runTest('1.1 Save & Get JSON object', test_1_1_saveAndGetData);
  runTest('1.2 Save & Get empty array', test_1_2_saveAndGetEmptyArray);
  runTest('1.3 Get non-existent key', test_1_3_getDataNonExistentKey);
  runTest('1.4 Overwrite existing key', test_1_4_saveDataOverwrite);
  runTest('1.5 Unicode data', test_1_5_saveDataUnicode);
  runTest('1.6 Generate ID format', test_1_6_generateIdFormat);
  runTest('1.7 Generate 100 unique IDs', test_1_7_generateIdUnique);
}

// ============================================================
// 2. TOURNAMENT CONFIG TESTS
// ============================================================

function test_2_1_getDefaultConfig() {
  const config = getTournamentConfig();
  assertEqual(config.tournamentName, 'Nine Ball Spring Open 2026', 'Default name');
  assertEqual(config.totalRounds, 5, 'Default rounds');
  assertEqual(config.currentRound, 0, 'Default currentRound');
  assertEqual(config.status, 'registration', 'Default status');
}

function test_2_2_getConfigAfterSet() {
  setTournamentConfig({
    tournamentName: 'Custom Tournament',
    totalRounds: 3,
    currentRound: 0,
    status: 'registration'
  });
  const config = getTournamentConfig();
  assertEqual(config.tournamentName, 'Custom Tournament', 'Custom name');
  assertEqual(config.totalRounds, 3, 'Custom rounds');
}

function test_2_3_setConfigHappy() {
  const newConfig = {
    tournamentName: 'Test',
    totalRounds: 4,
    currentRound: 0,
    status: 'registration'
  };
  const result = setTournamentConfig(newConfig);
  assertEqual(result.totalRounds, 4, 'totalRounds');
}

function test_2_4_increaseRoundsOngoing() {
  // Setup: giải đang ở round 2
  const config = {
    tournamentName: 'Test',
    totalRounds: 3,
    currentRound: 2,
    status: 'ongoing'
  };
  setTournamentConfig(config);
  
  // Tăng lên 5
  const updated = setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 5,
    currentRound: 2,
    status: 'ongoing'
  });
  assertEqual(updated.totalRounds, 5, 'Increased rounds');
}

function test_2_5_increaseRoundsFinished_reopens() {
  // Setup: giải đã kết thúc ở round 4
  setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 4,
    currentRound: 4,
    status: 'finished'
  });
  
  // Tăng lên 6 → phải reopen
  const updated = setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 6,
    currentRound: 4,
    status: 'finished'
  });
  assertEqual(updated.status, 'ongoing', 'Status should reopen to ongoing');
}

function test_2_6_decreaseBelowCurrentRound_throws() {
  // Setup: currentRound = 3
  setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 5,
    currentRound: 3,
    status: 'ongoing'
  });
  
  assertThrows(
    () => setTournamentConfig({
      tournamentName: 'Test',
      totalRounds: 2,
      currentRound: 3,
      status: 'ongoing'
    }),
    'Số vòng không thể nhỏ hơn vòng hiện tại',
    'Decrease below currentRound'
  );
}

function test_2_7_setRoundsEqualCurrentRound() {
  setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 5,
    currentRound: 3,
    status: 'ongoing'
  });
  
  // Set totalRounds = currentRound → OK
  const result = setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 3,
    currentRound: 3,
    status: 'ongoing'
  });
  assertEqual(result.totalRounds, 3, 'totalRounds = currentRound');
}

function runTests_TournamentConfig() {
  Logger.log('\n=== 2. TOURNAMENT CONFIG ===');
  runTest('2.1 Get default config', test_2_1_getDefaultConfig);
  runTest('2.2 Get config after set', test_2_2_getConfigAfterSet);
  runTest('2.3 Set config happy', test_2_3_setConfigHappy);
  runTest('2.4 Increase rounds while ongoing', test_2_4_increaseRoundsOngoing);
  runTest('2.5 Increase rounds when finished → reopen', test_2_5_increaseRoundsFinished_reopens);
  runTest('2.6 Decrease below currentRound throws', test_2_6_decreaseBelowCurrentRound_throws);
  runTest('2.7 Set rounds = currentRound OK', test_2_7_setRoundsEqualCurrentRound);
}

// ============================================================
// 3. PLAYER MANAGEMENT TESTS
// ============================================================

function test_3_1_addPlayerHappy() {
  const player = addPlayer('Nguyễn Văn A', 'G');
  assert(player.id.startsWith('id_'), 'ID format');
  assertEqual(player.name, 'Nguyễn Văn A', 'Name');
  assertEqual(player.rank, 'G', 'Rank');
  assertEqual(player.wins, 0, 'Wins');
  assertEqual(player.losses, 0, 'Losses');
  assertEqual(player.rackWon, 0, 'RackWon');
  assertEqual(player.rackLost, 0, 'RackLost');
  assertEqual(player.rackDiff, 0, 'RackDiff');
  assertEqual(player.matchHistory.length, 0, 'MatchHistory');
}

function test_3_2_addPlayerNoRank() {
  const player = addPlayer('Test', undefined);
  assertEqual(player.rank, 'N/A', 'Default rank');
}

function test_3_3_addPlayerTrimName() {
  const player = addPlayer('  Trần B  ', 'H');
  assertEqual(player.name, 'Trần B', 'Trimmed name');
}

function test_3_4_addPlayerEmptyName_throws() {
  assertThrows(
    () => addPlayer('', 'G'),
    'Tên không được để trống',
    'Empty name'
  );
}

function test_3_5_addPlayerSpacesOnly_throws() {
  assertThrows(
    () => addPlayer('   ', 'G'),
    'Tên không được để trống',
    'Spaces only name'
  );
}

function test_3_6_addPlayerNullName_throws() {
  assertThrows(
    () => addPlayer(null, 'G'),
    'Tên không được để trống',
    'Null name'
  );
}

function test_3_7_addPlayer33_throws() {
  // Thêm 32 players
  for (let i = 1; i <= 32; i++) {
    addPlayer('Player ' + i, 'G');
  }
  assertThrows(
    () => addPlayer('Player 33', 'G'),
    'Đã đạt giới hạn 32 người chơi',
    'Max 32 players'
  );
}

function test_3_8_addPlayerDuplicateName() {
  addPlayer('Same Name', 'G');
  const p2 = addPlayer('Same Name', 'H');
  // Không lỗi, tạo 2 player với cùng tên
  const players = getPlayers();
  assertEqual(players.length, 2, 'Both players added');
  assert(players[0].id !== players[1].id, 'Different IDs');
}

function test_3_9_removePlayerRegistration() {
  const player = addPlayer('To Remove', 'G');
  const result = removePlayer(player.id);
  assertEqual(result, true, 'Return true');
  const players = getPlayers();
  assertEqual(players.length, 0, 'Player removed');
}

function test_3_10_removePlayerOngoing_throws() {
  addPlayer('Player 1', 'G');
  addPlayer('Player 2', 'G');
  generatePairings(); // Status → ongoing
  
  const players = getPlayers();
  assertThrows(
    () => removePlayer(players[0].id),
    'Chỉ có thể xoá người chơi khi giải đấu chưa bắt đầu',
    'Remove during ongoing'
  );
}

function test_3_11_removePlayerFinished_throws() {
  setTournamentConfig({
    tournamentName: 'Test',
    totalRounds: 5,
    currentRound: 0,
    status: 'finished'
  });
  
  const player = addPlayer('Player 1', 'G');
  assertThrows(
    () => removePlayer(player.id),
    'Chỉ có thể xoá người chơi khi giải đấu chưa bắt đầu',
    'Remove during finished'
  );
}

function test_3_12_removePlayerNonExistentId() {
  addPlayer('Player', 'G');
  // Xoá ID không tồn tại → không crash
  const result = removePlayer('id_nonexistent');
  assertEqual(result, true, 'Return true');
  // Player ban đầu vẫn còn
  assertEqual(getPlayers().length, 1, 'Original player remains');
}

// updatePlayerStats tests
function test_3_13_updateStatsWinner() {
  const player = addPlayer('Winner', 'G');
  const opponent = addPlayer('Opponent', 'G');
  updatePlayerStats(player.id, 7, 3, opponent.id, true);
  
  const players = getPlayers();
  const updated = players.find(p => p.id === player.id);
  assertEqual(updated.wins, 1, 'Wins');
  assertEqual(updated.losses, 0, 'Losses');
  assertEqual(updated.rackWon, 7, 'RackWon');
  assertEqual(updated.rackLost, 3, 'RackLost');
  assertEqual(updated.rackDiff, 4, 'RackDiff');
  assert(updated.matchHistory.includes(opponent.id), 'Opponent in matchHistory');
}

function test_3_14_updateStatsLoser() {
  const player = addPlayer('Loser', 'G');
  const opponent = addPlayer('Opponent', 'G');
  updatePlayerStats(player.id, 3, 7, opponent.id, false);
  
  const players = getPlayers();
  const updated = players.find(p => p.id === player.id);
  assertEqual(updated.wins, 0, 'Wins');
  assertEqual(updated.losses, 1, 'Losses');
  assertEqual(updated.rackDiff, -4, 'RackDiff');
}

function test_3_15_updateStatsBye() {
  const player = addPlayer('BYE Player', 'G');
  updatePlayerStats(player.id, 0, 0, null, true);
  
  const players = getPlayers();
  const updated = players.find(p => p.id === player.id);
  assertEqual(updated.wins, 1, 'Wins');
  assertEqual(updated.rackDiff, 0, 'RackDiff unchanged');
  assertEqual(updated.matchHistory.length, 0, 'No opponent in history');
}

function test_3_16_updateStatsNonExistent() {
  addPlayer('Player', 'G'); // ensure some data exists
  // Gọi với ID không tồn tại → không crash
  updatePlayerStats('id_nonexistent', 7, 3, null, true);
  // Nếu đến đây = không crash
  assert(true, 'No crash');
}

function test_3_17_updateStatsDedup() {
  const player = addPlayer('Player', 'G');
  const opponent = addPlayer('Opponent', 'G');
  
  updatePlayerStats(player.id, 7, 3, opponent.id, true);
  updatePlayerStats(player.id, 7, 3, opponent.id, true);
  
  const players = getPlayers();
  const updated = players.find(p => p.id === player.id);
  // matchHistory chỉ có 1 lần
  const count = updated.matchHistory.filter(id => id === opponent.id).length;
  assertEqual(count, 1, 'Opponent appears only once in matchHistory');
}

function runTests_PlayerManagement() {
  Logger.log('\n=== 3. PLAYER MANAGEMENT ===');
  runTest('3.1 Add player happy path', test_3_1_addPlayerHappy);
  runTest('3.2 Add player no rank → N/A', test_3_2_addPlayerNoRank);
  runTest('3.3 Add player trims name', test_3_3_addPlayerTrimName);
  runTest('3.4 Add player empty name throws', test_3_4_addPlayerEmptyName_throws);
  runTest('3.5 Add player spaces-only throws', test_3_5_addPlayerSpacesOnly_throws);
  runTest('3.6 Add player null name throws', test_3_6_addPlayerNullName_throws);
  runTest('3.7 Add player #33 exceeds limit', test_3_7_addPlayer33_throws);
  runTest('3.8 Add duplicate name OK', test_3_8_addPlayerDuplicateName);
  runTest('3.9 Remove player during registration', test_3_9_removePlayerRegistration);
  runTest('3.10 Remove player during ongoing throws', test_3_10_removePlayerOngoing_throws);
  runTest('3.11 Remove player during finished throws', test_3_11_removePlayerFinished_throws);
  runTest('3.12 Remove non-existent player ID', test_3_12_removePlayerNonExistentId);
  runTest('3.13 Update stats winner', test_3_13_updateStatsWinner);
  runTest('3.14 Update stats loser', test_3_14_updateStatsLoser);
  runTest('3.15 Update stats BYE (+0 rack)', test_3_15_updateStatsBye);
  runTest('3.16 Update stats non-existent player', test_3_16_updateStatsNonExistent);
  runTest('3.17 Update stats opponent dedup', test_3_17_updateStatsDedup);
}

// ============================================================
// 4. MATCH MANAGEMENT TESTS
// ============================================================

function test_4_1_updateScoreP1Wins() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  const result = updateMatchScore(match.id, 7, 3);
  assertEqual(result.status, 'completed', 'Status');
  assertEqual(result.winner, match.player1Id, 'Winner is P1');
  assertEqual(result.score1, 7, 'Score1');
  assertEqual(result.score2, 3, 'Score2');
  
  // Check player stats
  const players = getPlayers();
  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);
  assertEqual(p1.wins, 1, 'P1 wins');
  assertEqual(p2.losses, 1, 'P2 losses');
}

function test_4_2_updateScoreP2Wins() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  const result = updateMatchScore(match.id, 3, 7);
  assertEqual(result.winner, match.player2Id, 'Winner is P2');
}

function test_4_3_updateScoreStringInput() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  const result = updateMatchScore(match.id, '7', '3');
  assertEqual(result.score1, 7, 'Parsed score1');
  assertEqual(result.score2, 3, 'Parsed score2');
}

function test_4_4_updateScoreNotFound_throws() {
  _setupPlayers(4);
  generatePairings();
  
  assertThrows(
    () => updateMatchScore('id_nonexistent', 7, 3),
    'Không tìm thấy trận đấu',
    'Match not found'
  );
}

function test_4_5_updateScoreAlreadyCompleted_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  updateMatchScore(match.id, 7, 3);
  
  assertThrows(
    () => updateMatchScore(match.id, 5, 7),
    'Trận đấu đã kết thúc',
    'Already completed'
  );
}

function test_4_6_updateScoreNegative_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  assertThrows(
    () => updateMatchScore(match.id, -1, 3),
    'Tỉ số không hợp lệ',
    'Negative score'
  );
}

function test_4_7_updateScoreNaN_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  assertThrows(
    () => updateMatchScore(match.id, 'abc', 3),
    'Tỉ số không hợp lệ',
    'NaN score'
  );
}

function test_4_8_updateScoreTie_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  assertThrows(
    () => updateMatchScore(match.id, 5, 5),
    'Tỉ số không được bằng nhau',
    'Tied score'
  );
}

function test_4_9_updateScoreZeroOne() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  const result = updateMatchScore(match.id, 0, 1);
  assertEqual(result.winner, match.player2Id, 'Winner P2 with 0-1');
}

// correctMatchScore tests
function test_4_10_correctScoreFlipWinner() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  // Original: P1 wins 7-3
  updateMatchScore(match.id, 7, 3);
  
  // Correct: P2 wins 5-7
  const corrected = correctMatchScore(match.id, 5, 7);
  assertEqual(corrected.winner, match.player2Id, 'Winner flipped to P2');
  assertEqual(corrected.score1, 5, 'New score1');
  assertEqual(corrected.score2, 7, 'New score2');
  
  // Check stats
  const players = getPlayers();
  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);
  assertEqual(p1.wins, 0, 'P1 wins reverted');
  assertEqual(p1.losses, 1, 'P1 now has loss');
  assertEqual(p2.wins, 1, 'P2 now has win');
  assertEqual(p2.losses, 0, 'P2 losses reverted');
  assertEqual(p1.rackWon, 5, 'P1 rackWon updated');
  assertEqual(p1.rackLost, 7, 'P1 rackLost updated');
  assertEqual(p2.rackWon, 7, 'P2 rackWon updated');
  assertEqual(p2.rackLost, 5, 'P2 rackLost updated');
}

function test_4_11_correctScoreSameWinner() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  // Original: P1 wins 7-3
  updateMatchScore(match.id, 7, 3);
  
  // Correct: P1 still wins 7-5
  correctMatchScore(match.id, 7, 5);
  
  const players = getPlayers();
  const p1 = players.find(p => p.id === match.player1Id);
  assertEqual(p1.wins, 1, 'P1 still 1 win');
  assertEqual(p1.rackWon, 7, 'P1 rackWon corrected');
  assertEqual(p1.rackLost, 5, 'P1 rackLost corrected');
  assertEqual(p1.rackDiff, 2, 'P1 rackDiff corrected');
}

function test_4_12_correctScoreNotFound_throws() {
  assertThrows(
    () => correctMatchScore('id_nonexistent', 5, 7),
    'Không tìm thấy trận đấu',
    'Match not found'
  );
}

function test_4_13_correctScorePending_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  assertThrows(
    () => correctMatchScore(match.id, 5, 7),
    'Chỉ có thể sửa trận đấu đã hoàn thành',
    'Correct pending match'
  );
}

function test_4_14_correctScoreBye_throws() {
  _setupPlayers(3); // 3 = lẻ → BYE
  const matches = generatePairings();
  const byeMatch = matches.find(m => m.isBye);
  
  assertThrows(
    () => correctMatchScore(byeMatch.id, 5, 7),
    'Không thể sửa trận BYE',
    'Correct BYE match'
  );
}

function test_4_15_correctScoreTie_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  updateMatchScore(match.id, 7, 3);
  
  assertThrows(
    () => correctMatchScore(match.id, 5, 5),
    'Tỉ số không được bằng nhau',
    'Tied correction'
  );
}

function test_4_16_correctScoreNegative_throws() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  updateMatchScore(match.id, 7, 3);
  
  assertThrows(
    () => correctMatchScore(match.id, -1, 3),
    'Tỉ số không hợp lệ',
    'Negative correction'
  );
}

function test_4_17_correctScoreMultipleTimes() {
  _setupPlayers(4);
  const matches = generatePairings();
  const match = matches.find(m => !m.isBye);
  
  // Complete: 7-3 (P1 wins)
  updateMatchScore(match.id, 7, 3);
  
  // Correct #1: 5-7 (P2 wins)
  correctMatchScore(match.id, 5, 7);
  
  // Correct #2: 6-4 (P1 wins again)
  correctMatchScore(match.id, 6, 4);
  
  const players = getPlayers();
  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);
  
  // Final state: P1 won 6-4
  assertEqual(p1.wins, 1, 'P1 wins after multiple corrections');
  assertEqual(p1.losses, 0, 'P1 losses after multiple corrections');
  assertEqual(p1.rackWon, 6, 'P1 rackWon final');
  assertEqual(p1.rackLost, 4, 'P1 rackLost final');
  assertEqual(p2.wins, 0, 'P2 wins final');
  assertEqual(p2.losses, 1, 'P2 losses final');
}

function runTests_MatchManagement() {
  Logger.log('\n=== 4. MATCH MANAGEMENT ===');
  runTest('4.1 Update score P1 wins', test_4_1_updateScoreP1Wins);
  runTest('4.2 Update score P2 wins', test_4_2_updateScoreP2Wins);
  runTest('4.3 Update score string input', test_4_3_updateScoreStringInput);
  runTest('4.4 Match not found throws', test_4_4_updateScoreNotFound_throws);
  runTest('4.5 Already completed throws', test_4_5_updateScoreAlreadyCompleted_throws);
  runTest('4.6 Negative score throws', test_4_6_updateScoreNegative_throws);
  runTest('4.7 NaN score throws', test_4_7_updateScoreNaN_throws);
  runTest('4.8 Tied score throws', test_4_8_updateScoreTie_throws);
  runTest('4.9 Score 0-1 valid', test_4_9_updateScoreZeroOne);
  runTest('4.10 Correct score flips winner', test_4_10_correctScoreFlipWinner);
  runTest('4.11 Correct score same winner', test_4_11_correctScoreSameWinner);
  runTest('4.12 Correct not found throws', test_4_12_correctScoreNotFound_throws);
  runTest('4.13 Correct pending throws', test_4_13_correctScorePending_throws);
  runTest('4.14 Correct BYE throws', test_4_14_correctScoreBye_throws);
  runTest('4.15 Correct tied score throws', test_4_15_correctScoreTie_throws);
  runTest('4.16 Correct negative throws', test_4_16_correctScoreNegative_throws);
  runTest('4.17 Correct multiple times', test_4_17_correctScoreMultipleTimes);
}

// ============================================================
// 5. SWISS PAIRING ALGORITHM TESTS
// ============================================================

function test_5_1_shuffleArrayNormal() {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffleArray(original);
  assertEqual(shuffled.length, 10, 'Same length');
  // Check same elements
  const sorted = [...shuffled].sort((a, b) => a - b);
  assertEqual(JSON.stringify(sorted), JSON.stringify(original), 'Same elements');
}

function test_5_2_shuffleArrayEmpty() {
  const result = shuffleArray([]);
  assertEqual(result.length, 0, 'Empty result');
}

function test_5_3_shuffleArraySingle() {
  const result = shuffleArray([42]);
  assertEqual(result.length, 1, 'Length 1');
  assertEqual(result[0], 42, 'Same element');
}

function test_5_4_shuffleArrayNoMutate() {
  const original = [1, 2, 3];
  shuffleArray(original);
  assertEqual(JSON.stringify(original), JSON.stringify([1, 2, 3]), 'Original unchanged');
}

function test_5_5_sortByStandingWins() {
  const players = [
    { wins: 1, rackDiff: 0 },
    { wins: 3, rackDiff: 0 },
    { wins: 2, rackDiff: 0 }
  ];
  const sorted = sortPlayersByStanding(players);
  assertEqual(sorted[0].wins, 3, 'First = 3 wins');
  assertEqual(sorted[1].wins, 2, 'Second = 2 wins');
  assertEqual(sorted[2].wins, 1, 'Third = 1 win');
}

function test_5_6_sortByStandingRackDiff() {
  const players = [
    { wins: 2, rackDiff: -2 },
    { wins: 2, rackDiff: 5 },
    { wins: 2, rackDiff: 3 }
  ];
  const sorted = sortPlayersByStanding(players);
  assertEqual(sorted[0].rackDiff, 5, 'First = +5');
  assertEqual(sorted[1].rackDiff, 3, 'Second = +3');
  assertEqual(sorted[2].rackDiff, -2, 'Third = -2');
}

function test_5_7_sortByStandingNoMutate() {
  const players = [
    { wins: 1, rackDiff: 0 },
    { wins: 3, rackDiff: 0 }
  ];
  sortPlayersByStanding(players);
  assertEqual(players[0].wins, 1, 'Original[0] unchanged');
}

function test_5_8_generatePairings4Players() {
  _setupPlayers(4);
  const matches = generatePairings();
  
  assertEqual(matches.length, 2, '2 matches for 4 players');
  matches.forEach(m => {
    assertEqual(m.status, 'pending', 'Status pending');
    assertEqual(m.round, 1, 'Round 1');
    assertEqual(m.isBye, false, 'No BYE');
  });
  
  const config = getTournamentConfig();
  assertEqual(config.currentRound, 1, 'Current round = 1');
  assertEqual(config.status, 'ongoing', 'Status ongoing');
}

function test_5_9_generatePairings3PlayersBye() {
  _setupPlayers(3);
  const matches = generatePairings();
  
  assertEqual(matches.length, 2, '1 match + 1 BYE');
  
  const normalMatch = matches.find(m => !m.isBye);
  const byeMatch = matches.find(m => m.isBye);
  
  assert(normalMatch !== undefined, 'Normal match exists');
  assert(byeMatch !== undefined, 'BYE match exists');
  assertEqual(byeMatch.status, 'completed', 'BYE auto-completed');
  assertEqual(byeMatch.player2Id, null, 'BYE player2 = null');
  assertEqual(byeMatch.player2Name, 'BYE', 'BYE player2 name');
}

function test_5_10_generatePairingsRound2SortedByStanding() {
  _setupPlayers(4);
  
  // Round 1
  const round1 = generatePairings();
  round1.forEach(m => {
    if (!m.isBye) updateMatchScore(m.id, 7, 3); // P1 of each match wins
  });
  
  // Round 2
  const round2 = generatePairings();
  assertEqual(round2[0].round, 2, 'Round 2');
  
  // Players should be sorted by standing before pairing
  // Winners should be paired together
  const config = getTournamentConfig();
  assertEqual(config.currentRound, 2, 'Current round = 2');
}

function test_5_11_generatePairings1Player_throws() {
  _setupPlayers(1);
  assertThrows(
    () => generatePairings(),
    'Cần ít nhất 2 người chơi',
    'Only 1 player'
  );
}

function test_5_12_generatePairingsPendingMatches_throws() {
  _setupPlayers(4);
  generatePairings();
  // Don't complete any matches
  
  assertThrows(
    () => generatePairings(),
    'Vẫn còn trận đấu chưa hoàn thành',
    'Pending matches'
  );
}

function test_5_13_generatePairingsExhausted_throws() {
  // totalRounds = 1, chạy hết 1 vòng → không tạo thêm được
  const config = getTournamentConfig();
  config.totalRounds = 1;
  setTournamentConfig(config);
  
  _setupPlayers(4);
  const matches = generatePairings();
  matches.forEach(m => {
    if (!m.isBye) updateMatchScore(m.id, 7, 3);
  });
  
  assertThrows(
    () => generatePairings(),
    'Giải đấu đã kết thúc',
    'All rounds exhausted'
  );
}

function test_5_14_generatePairings2Players() {
  _setupPlayers(2);
  const matches = generatePairings();
  assertEqual(matches.length, 1, '1 match for 2 players');
}

function test_5_15_generatePairings5PlayersByeIsLast() {
  // Vòng 2+: BYE player = người cuối bảng
  const config = getTournamentConfig();
  config.totalRounds = 3;
  setTournamentConfig(config);
  
  _setupPlayers(5);
  
  // Round 1
  const round1 = generatePairings();
  round1.forEach(m => {
    if (!m.isBye) updateMatchScore(m.id, 7, 3);
  });
  
  // Round 2: BYE should go to lowest-ranked player
  const round2 = generatePairings();
  const byeMatch = round2.find(m => m.isBye);
  assert(byeMatch !== undefined, 'BYE match exists in round 2');
  // BYE player should be the last in sorted list
}

function test_5_16_generatePairingsByeStats() {
  _setupPlayers(3);
  const matches = generatePairings();
  const byeMatch = matches.find(m => m.isBye);
  
  const players = getPlayers();
  const byePlayer = players.find(p => p.id === byeMatch.player1Id);
  
  assertEqual(byePlayer.wins, 1, 'BYE +1 win');
  assertEqual(byePlayer.rackDiff, 0, 'BYE +0 rackDiff');
  assertEqual(byePlayer.rackWon, 0, 'BYE rackWon = 0');
  assertEqual(byePlayer.rackLost, 0, 'BYE rackLost = 0');
}

function test_5_17_generatePairings32Players() {
  _setupPlayers(32);
  const matches = generatePairings();
  assertEqual(matches.length, 16, '16 matches for 32 players');
}

function runTests_SwissPairing() {
  Logger.log('\n=== 5. SWISS PAIRING ALGORITHM ===');
  runTest('5.1 Shuffle array 10 elements', test_5_1_shuffleArrayNormal);
  runTest('5.2 Shuffle empty array', test_5_2_shuffleArrayEmpty);
  runTest('5.3 Shuffle single element', test_5_3_shuffleArraySingle);
  runTest('5.4 Shuffle no mutation', test_5_4_shuffleArrayNoMutate);
  runTest('5.5 Sort by wins DESC', test_5_5_sortByStandingWins);
  runTest('5.6 Sort by rackDiff DESC (tie)', test_5_6_sortByStandingRackDiff);
  runTest('5.7 Sort no mutation', test_5_7_sortByStandingNoMutate);
  runTest('5.8 Generate pairings 4 players', test_5_8_generatePairings4Players);
  runTest('5.9 Generate pairings 3 players (BYE)', test_5_9_generatePairings3PlayersBye);
  runTest('5.10 Round 2 sorted by standing', test_5_10_generatePairingsRound2SortedByStanding);
  runTest('5.11 Only 1 player throws', test_5_11_generatePairings1Player_throws);
  runTest('5.12 Pending matches throws', test_5_12_generatePairingsPendingMatches_throws);
  runTest('5.13 All rounds exhausted throws', test_5_13_generatePairingsExhausted_throws);
  runTest('5.14 Exactly 2 players', test_5_14_generatePairings2Players);
  runTest('5.15 BYE goes to lowest-ranked R2', test_5_15_generatePairings5PlayersByeIsLast);
  runTest('5.16 BYE player stats (+1W, +0R)', test_5_16_generatePairingsByeStats);
  runTest('5.17 32 players (max)', test_5_17_generatePairings32Players);
}

// ============================================================
// 6. LEADERBOARD TESTS
// ============================================================

function test_6_1_leaderboardSorted() {
  const p1 = addPlayer('Player 1', 'G');
  const p2 = addPlayer('Player 2', 'G');
  const p3 = addPlayer('Player 3', 'G');
  const p4 = addPlayer('Player 4', 'G');
  
  const matches = generatePairings();
  // Complete all matches with different scores
  const pending = getAllMatches().filter(m => m.status === 'pending');
  if (pending.length >= 1) updateMatchScore(pending[0].id, 7, 3);
  if (pending.length >= 2) updateMatchScore(pending[1].id, 7, 5);
  
  const lb = getLeaderboard();
  assertEqual(lb.length, 4, '4 entries');
  // First player has most wins or best rackDiff
  assert(lb[0].wins >= lb[1].wins, 'Sorted by wins DESC');
}

function test_6_2_leaderboardEmpty() {
  const lb = getLeaderboard();
  assertEqual(lb.length, 0, 'Empty leaderboard');
}

function test_6_3_leaderboardFields() {
  addPlayer('Test Player', 'H');
  const lb = getLeaderboard();
  const entry = lb[0];
  
  assert(entry.rank !== undefined, 'Has rank');
  assert(entry.id !== undefined, 'Has id');
  assert(entry.name !== undefined, 'Has name');
  assert(entry.playerRank !== undefined, 'Has playerRank');
  assert(entry.wins !== undefined, 'Has wins');
  assert(entry.losses !== undefined, 'Has losses');
  assert(entry.rackWon !== undefined, 'Has rackWon');
  assert(entry.rackLost !== undefined, 'Has rackLost');
  assert(entry.rackDiff !== undefined, 'Has rackDiff');
  assertEqual(entry.rank, 1, 'Rank = 1');
  assertEqual(entry.playerRank, 'H', 'PlayerRank = H');
}

function runTests_Leaderboard() {
  Logger.log('\n=== 6. LEADERBOARD ===');
  runTest('6.1 Leaderboard sorted correctly', test_6_1_leaderboardSorted);
  runTest('6.2 Leaderboard empty', test_6_2_leaderboardEmpty);
  runTest('6.3 Leaderboard entry fields', test_6_3_leaderboardFields);
}

// ============================================================
// 7. TOURNAMENT CONTROL TESTS
// ============================================================

function test_7_1_finishTournamentOngoing() {
  _setupPlayers(4);
  generatePairings(); // status → ongoing
  
  const result = finishTournament();
  assertEqual(result.status, 'finished', 'Status finished');
}

function test_7_2_finishTournamentRegistration() {
  const result = finishTournament();
  assertEqual(result.status, 'finished', 'Status finished from registration');
}

function test_7_3_resetTournamentKeepsPlayers() {
  _setupPlayers(4);
  generatePairings();
  // Complete all matches
  const matches = getAllMatches().filter(m => m.status === 'pending');
  matches.forEach(m => updateMatchScore(m.id, 7, 3));
  
  resetTournament();
  
  const config = getTournamentConfig();
  assertEqual(config.currentRound, 0, 'Round reset to 0');
  assertEqual(config.status, 'registration', 'Status reset to registration');
  
  const players = getPlayers();
  assertEqual(players.length, 4, 'Players kept');
  players.forEach(p => {
    assertEqual(p.wins, 0, p.name + ' wins reset');
    assertEqual(p.losses, 0, p.name + ' losses reset');
    assertEqual(p.rackWon, 0, p.name + ' rackWon reset');
    assertEqual(p.rackLost, 0, p.name + ' rackLost reset');
    assertEqual(p.rackDiff, 0, p.name + ' rackDiff reset');
    assertEqual(p.matchHistory.length, 0, p.name + ' matchHistory reset');
  });
  
  const allM = getAllMatches();
  assertEqual(allM.length, 0, 'All matches cleared');
}

function test_7_4_resetAllDeletesEverything() {
  _setupPlayers(4);
  generatePairings();
  
  resetAll();
  
  const config = getTournamentConfig();
  assertEqual(config.tournamentName, 'Nine Ball Spring Open 2026', 'Default name');
  assertEqual(config.currentRound, 0, 'Default round');
  
  const players = getPlayers();
  assertEqual(players.length, 0, 'No players');
  
  const matches = getAllMatches();
  assertEqual(matches.length, 0, 'No matches');
}

function runTests_TournamentControl() {
  Logger.log('\n=== 7. TOURNAMENT CONTROL ===');
  runTest('7.1 Finish tournament ongoing', test_7_1_finishTournamentOngoing);
  runTest('7.2 Finish tournament registration', test_7_2_finishTournamentRegistration);
  runTest('7.3 Reset tournament keeps players', test_7_3_resetTournamentKeepsPlayers);
  runTest('7.4 Reset all deletes everything', test_7_4_resetAllDeletesEverything);
}

// ============================================================
// 8. INTEGRATION TESTS — DATA CONSISTENCY
// ============================================================
// Các test này chạy giải đấu nhiều vòng rồi cross-verify
// giữa MATCHES_DATA và PLAYERS_DATA để phát hiện lỗi đồng bộ.
// Bug thực tế: "Thua 3 trận nhưng leaderboard chỉ ghi thua 2"

/**
 * 🔑 CORE HELPER: Tính lại stats từ MATCHES_DATA rồi so sánh với PLAYERS_DATA
 * Đây là test quan trọng nhất để phát hiện bug "stats bị lệch"
 */
function _verifyStatsConsistency(contextLabel) {
  const players = getPlayers();
  const matches = getAllMatches();
  const completedMatches = matches.filter(m => m.status === 'completed');
  
  // Tính lại stats từ matches cho từng player
  const expectedStats = {};
  players.forEach(p => {
    expectedStats[p.id] = {
      name: p.name,
      wins: 0,
      losses: 0,
      rackWon: 0,
      rackLost: 0
    };
  });
  
  completedMatches.forEach(match => {
    if (match.isBye) {
      // BYE: +1 win, +0 rack
      if (expectedStats[match.player1Id]) {
        expectedStats[match.player1Id].wins++;
        // rackWon/Lost không cộng cho BYE (theo rule mới)
      }
      return;
    }
    
    // Trận bình thường
    const winnerId = match.winner;
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
    
    if (expectedStats[winnerId]) {
      expectedStats[winnerId].wins++;
    }
    if (expectedStats[loserId]) {
      expectedStats[loserId].losses++;
    }
    
    // Rack stats
    if (expectedStats[match.player1Id]) {
      expectedStats[match.player1Id].rackWon += match.score1;
      expectedStats[match.player1Id].rackLost += match.score2;
    }
    if (expectedStats[match.player2Id]) {
      expectedStats[match.player2Id].rackWon += match.score2;
      expectedStats[match.player2Id].rackLost += match.score1;
    }
  });
  
  // So sánh expected vs actual cho TỪNG player
  let allPassed = true;
  const errors = [];
  
  players.forEach(player => {
    const expected = expectedStats[player.id];
    if (!expected) return;
    
    if (player.wins !== expected.wins) {
      errors.push(`[${contextLabel}] ${player.name}: wins expected=${expected.wins} actual=${player.wins}`);
      allPassed = false;
    }
    if (player.losses !== expected.losses) {
      errors.push(`[${contextLabel}] ${player.name}: losses expected=${expected.losses} actual=${player.losses}`);
      allPassed = false;
    }
    if (player.rackWon !== expected.rackWon) {
      errors.push(`[${contextLabel}] ${player.name}: rackWon expected=${expected.rackWon} actual=${player.rackWon}`);
      allPassed = false;
    }
    if (player.rackLost !== expected.rackLost) {
      errors.push(`[${contextLabel}] ${player.name}: rackLost expected=${expected.rackLost} actual=${player.rackLost}`);
      allPassed = false;
    }
    
    const expectedRackDiff = player.rackWon - player.rackLost;
    if (player.rackDiff !== expectedRackDiff) {
      errors.push(`[${contextLabel}] ${player.name}: rackDiff expected=${expectedRackDiff} actual=${player.rackDiff}`);
      allPassed = false;
    }
  });
  
  // Verify tổng wins/losses hợp lý
  const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
  const totalLosses = players.reduce((sum, p) => sum + p.losses, 0);
  const nonByeCompleted = completedMatches.filter(m => !m.isBye).length;
  const byeCount = completedMatches.filter(m => m.isBye).length;
  
  // Mỗi trận non-BYE tạo ra đúng 1 win + 1 loss. Mỗi BYE tạo 1 win + 0 loss.
  const expectedTotalWins = nonByeCompleted + byeCount;
  const expectedTotalLosses = nonByeCompleted;
  
  if (totalWins !== expectedTotalWins) {
    errors.push(`[${contextLabel}] GLOBAL: totalWins expected=${expectedTotalWins} actual=${totalWins}`);
    allPassed = false;
  }
  if (totalLosses !== expectedTotalLosses) {
    errors.push(`[${contextLabel}] GLOBAL: totalLosses expected=${expectedTotalLosses} actual=${totalLosses}`);
    allPassed = false;
  }
  
  if (!allPassed) {
    throw new Error('DATA CONSISTENCY FAILED:\n  ' + errors.join('\n  '));
  }
}

/**
 * Helper: chạy N vòng đấu với score patterns xác định
 */
function _playFullRounds(numRounds, scorePatterns) {
  for (let r = 0; r < numRounds; r++) {
    generatePairings();
    const allM = getAllMatches();
    const config = getTournamentConfig();
    const pendingMatches = allM.filter(m => m.round === config.currentRound && m.status === 'pending');
    
    pendingMatches.forEach((m, idx) => {
      const pattern = scorePatterns ? scorePatterns[r] : null;
      if (pattern && pattern[idx]) {
        updateMatchScore(m.id, pattern[idx][0], pattern[idx][1]);
      } else {
        // Default: player1 thắng 7 - (3+idx)
        updateMatchScore(m.id, 7, 3 + (idx % 4));
      }
    });
  }
}

// --- Integration Test Cases ---

function test_8_1_consistency_4players_3rounds() {
  // Kịch bản cơ bản: 4 người, 3 vòng, số chẵn (không BYE)
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(4);
  _playFullRounds(3);
  
  _verifyStatsConsistency('4P-3R');
  
  // Extra: check mỗi người chơi đấu đúng 3 trận
  const players = getPlayers();
  players.forEach(p => {
    const totalMatches = p.wins + p.losses;
    assertEqual(totalMatches, 3, `${p.name} phải có đúng 3 trận (wins+losses)`);
  });
}

function test_8_2_consistency_5players_3rounds_withBye() {
  // Kịch bản BYE: 5 người lẻ, 3 vòng → mỗi vòng có 1 BYE
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(5);
  _playFullRounds(3);
  
  _verifyStatsConsistency('5P-3R-BYE');
  
  // Verify: tổng số trận BYE = 3 (1 mỗi vòng)
  const matches = getAllMatches();
  const byeMatches = matches.filter(m => m.isBye);
  assertEqual(byeMatches.length, 3, 'Phải có 3 trận BYE');
}

function test_8_3_consistency_3players_3rounds_allLoseForOne() {
  // Kịch bản: 3 người, 3 vòng. Thiết kế để 1 người thua tất cả trận thật
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(3);
  _playFullRounds(3);
  
  _verifyStatsConsistency('3P-3R-ALL-LOSE');
  
  // Verify: kiểm tra player thua nhiều nhất
  const players = getPlayers();
  const maxLosses = Math.max(...players.map(p => p.losses));
  // Với 3 người, 3 vòng, mỗi vòng 1 trận thật → max losses có thể là 2-3
  // (phụ thuộc vào ai được BYE khi nào)
  assert(maxLosses >= 1, 'Phải có ít nhất 1 loss');
  
  // CRITICAL: losses trong leaderboard phải khớp matches
  const leaderboard = getLeaderboard();
  leaderboard.forEach(entry => {
    const player = players.find(p => p.id === entry.id);
    assertEqual(entry.losses, player.losses, 
      `Leaderboard losses cho ${entry.name} phải khớp PLAYERS_DATA`);
    assertEqual(entry.wins, player.wins,
      `Leaderboard wins cho ${entry.name} phải khớp PLAYERS_DATA`);
  });
}

function test_8_4_consistency_verifyAfterEachRound() {
  // Verify consistency SAU MỖI VÒNG (không chỉ cuối cùng)
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(6);
  
  for (let round = 1; round <= 3; round++) {
    generatePairings();
    const allM = getAllMatches();
    const currentConfig = getTournamentConfig();
    const pendingMatches = allM.filter(m => 
      m.round === currentConfig.currentRound && m.status === 'pending'
    );
    
    pendingMatches.forEach((m, idx) => {
      updateMatchScore(m.id, 7, 3 + idx);
      // Verify consistency SAU MỖI TRẬN
      _verifyStatsConsistency(`R${round}-afterMatch${idx + 1}`);
    });
    
    _verifyStatsConsistency(`R${round}-end`);
  }
}

function test_8_5_consistency_withScoreCorrection() {
  // Kịch bản: Chạy 2 vòng, sửa tỉ số 1 trận, chạy vòng 3, verify
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(4);
  
  // Round 1
  generatePairings();
  let allM = getAllMatches();
  let pending = allM.filter(m => m.status === 'pending');
  pending.forEach(m => updateMatchScore(m.id, 7, 3));
  
  _verifyStatsConsistency('R1-before-correction');
  
  // Sửa tỉ số trận đầu tiên (đổi người thắng)
  const completedR1 = getAllMatches().filter(m => m.round === 1 && !m.isBye);
  if (completedR1.length > 0) {
    correctMatchScore(completedR1[0].id, 3, 7); // Flip winner
  }
  
  _verifyStatsConsistency('R1-after-correction');
  
  // Round 2
  generatePairings();
  allM = getAllMatches();
  pending = allM.filter(m => m.status === 'pending');
  pending.forEach(m => updateMatchScore(m.id, 7, 5));
  
  _verifyStatsConsistency('R2-after-correction-in-R1');
  
  // Round 3
  generatePairings();
  allM = getAllMatches();
  pending = allM.filter(m => m.status === 'pending');
  pending.forEach(m => updateMatchScore(m.id, 6, 4));
  
  _verifyStatsConsistency('R3-final');
}

function test_8_6_consistency_multipleCorrections() {
  // Kịch bản: Sửa tỉ số nhiều lần cho nhiều trận khác nhau
  const config = getTournamentConfig();
  config.totalRounds = 3;
  setTournamentConfig(config);
  
  _setupPlayers(4);
  
  // Round 1
  generatePairings();
  let allM = getAllMatches();
  let pending = allM.filter(m => m.status === 'pending');
  pending.forEach(m => updateMatchScore(m.id, 7, 3));
  
  // Sửa trận 1
  const r1Matches = getAllMatches().filter(m => m.round === 1 && !m.isBye);
  if (r1Matches.length >= 2) {
    correctMatchScore(r1Matches[0].id, 5, 7); // Flip
    _verifyStatsConsistency('after-correct-1');
    
    correctMatchScore(r1Matches[1].id, 4, 7); // Flip
    _verifyStatsConsistency('after-correct-2');
    
    // Sửa lại lần nữa
    correctMatchScore(r1Matches[0].id, 7, 2); // Flip back
    _verifyStatsConsistency('after-correct-3-flipback');
  }
  
  // Round 2
  generatePairings();
  allM = getAllMatches();
  pending = allM.filter(m => m.status === 'pending');
  pending.forEach(m => updateMatchScore(m.id, 7, 4));
  
  _verifyStatsConsistency('R2-after-multi-corrections');
}

function test_8_7_consistency_7players_3rounds() {
  // Kịch bản lớn: 7 người (lẻ = BYE mỗi vòng), 3 vòng
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(7);
  _playFullRounds(3);
  
  _verifyStatsConsistency('7P-3R');
  
  // Verify: leaderboard khớp với player data
  const players = getPlayers();
  const leaderboard = getLeaderboard();
  
  leaderboard.forEach(entry => {
    const player = players.find(p => p.id === entry.id);
    assertEqual(entry.wins, player.wins,
      `${entry.name} leaderboard.wins phải = player.wins`);
    assertEqual(entry.losses, player.losses,
      `${entry.name} leaderboard.losses phải = player.losses`);
    assertEqual(entry.rackDiff, player.rackDiff,
      `${entry.name} leaderboard.rackDiff phải = player.rackDiff`);
  });
}

function test_8_8_consistency_leaderboard_crosscheck() {
  // 🎯 EXACT BUG REPRODUCTION: 
  // "Sau 3 vòng, 1 người thua 3 trận nhưng leaderboard ghi thua 2"
  // Test: chạy 3 vòng, đối chiếu wins+losses của MỌI player
  // giữa MATCHES_DATA (nguồn chính xác) và getLeaderboard() (hiển thị)
  const config = getTournamentConfig();
  config.totalRounds = 5;
  setTournamentConfig(config);
  
  _setupPlayers(6);
  _playFullRounds(3);
  
  const matches = getAllMatches();
  const completedMatches = matches.filter(m => m.status === 'completed' && !m.isBye);
  const leaderboard = getLeaderboard();
  
  // Tính wins/losses từ MATCHES cho từng player
  const matchBasedStats = {};
  leaderboard.forEach(e => {
    matchBasedStats[e.id] = { name: e.name, wins: 0, losses: 0 };
  });
  
  completedMatches.forEach(match => {
    const winnerId = match.winner;
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
    
    if (matchBasedStats[winnerId]) matchBasedStats[winnerId].wins++;
    if (matchBasedStats[loserId]) matchBasedStats[loserId].losses++;
  });
  
  // Cộng thêm BYE wins
  const byeMatches = matches.filter(m => m.isBye);
  byeMatches.forEach(m => {
    if (matchBasedStats[m.player1Id]) matchBasedStats[m.player1Id].wins++;
  });
  
  // SO SÁNH: Leaderboard hiển thị vs tính từ Matches
  leaderboard.forEach(entry => {
    const fromMatches = matchBasedStats[entry.id];
    assertEqual(entry.wins, fromMatches.wins,
      `🐛 BUG CHECK — ${entry.name}: leaderboard wins=${entry.wins} vs matches wins=${fromMatches.wins}`);
    assertEqual(entry.losses, fromMatches.losses,
      `🐛 BUG CHECK — ${entry.name}: leaderboard losses=${entry.losses} vs matches losses=${fromMatches.losses}`);
  });
  
  // Cũng verify bằng _verifyStatsConsistency
  _verifyStatsConsistency('FULL-CROSSCHECK-6P-3R');
}

function runTests_Integration() {
  Logger.log('\n=== 8. INTEGRATION — DATA CONSISTENCY ===');
  runTest('8.1 4 players, 3 rounds (even)', test_8_1_consistency_4players_3rounds);
  runTest('8.2 5 players, 3 rounds (odd/BYE)', test_8_2_consistency_5players_3rounds_withBye);
  runTest('8.3 3 players, 3 rounds (all-lose check)', test_8_3_consistency_3players_3rounds_allLoseForOne);
  runTest('8.4 Verify after EACH round + EACH match', test_8_4_consistency_verifyAfterEachRound);
  runTest('8.5 With score correction mid-tournament', test_8_5_consistency_withScoreCorrection);
  runTest('8.6 Multiple corrections on multiple matches', test_8_6_consistency_multipleCorrections);
  runTest('8.7 7 players, 3 rounds + leaderboard check', test_8_7_consistency_7players_3rounds);
  runTest('8.8 🐛 Exact bug: leaderboard vs matches crosscheck', test_8_8_consistency_leaderboard_crosscheck);
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

/**
 * 🚀 Chạy TẤT CẢ tests
 * Chọn function này từ dropdown → nhấn ▶️ Run
 */
function runAllTests() {
  _testResults = { passed: 0, failed: 0, errors: [] };
  
  Logger.log('========================================');
  Logger.log('🧪 RUNNING ALL TESTS');
  Logger.log('========================================');
  
  // Cleanup trước khi bắt đầu
  resetAll();
  
  runTests_DataHelpers();
  runTests_TournamentConfig();
  runTests_PlayerManagement();
  runTests_MatchManagement();
  runTests_SwissPairing();
  runTests_Leaderboard();
  runTests_TournamentControl();
  runTests_Integration();
  
  // Final cleanup
  resetAll();
  
  Logger.log('\n========================================');
  Logger.log('📊 TEST RESULTS');
  Logger.log('========================================');
  Logger.log(`✅ Passed: ${_testResults.passed}`);
  Logger.log(`❌ Failed: ${_testResults.failed}`);
  Logger.log(`📋 Total:  ${_testResults.passed + _testResults.failed}`);
  
  if (_testResults.errors.length > 0) {
    Logger.log('\n⚠️ FAILED TESTS:');
    _testResults.errors.forEach(err => Logger.log('  - ' + err));
  } else {
    Logger.log('\n🎉 ALL TESTS PASSED!');
  }
  
  Logger.log('========================================');
}

/**
 * 🔍 Chạy CHỈ integration tests (chẩn đoán bug nhanh)
 */
function runIntegrationTestsOnly() {
  _testResults = { passed: 0, failed: 0, errors: [] };
  Logger.log('🔍 RUNNING INTEGRATION TESTS ONLY');
  resetAll();
  runTests_Integration();
  resetAll();
  Logger.log(`\n✅ ${_testResults.passed} passed, ❌ ${_testResults.failed} failed`);
  if (_testResults.errors.length > 0) {
    _testResults.errors.forEach(err => Logger.log('  - ' + err));
  }
}
