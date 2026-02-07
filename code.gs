// Hàm này chạy khi có người truy cập vào link
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  
  // Kiểm tra tham số ?key= trene URL để xác định quyền cập nhật
  // Bạn có thể đổi 'admin123' thành mật khẩu riêng của bạn
  template.isAdmin = (e.parameter.key === 'admin123'); 
  
  return template.evaluate()
    .setTitle('Cập nhật Tỉ số Trực tuyến')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Hàm lấy dữ liệu từ bộ nhớ PropertiesService
function getScores() {
  return PropertiesService.getScriptProperties().getProperty('DATA_SCORES') || "Chưa có trận đấu nào.";
}

// Hàm lưu dữ liệu mới vào bộ nhớ
function saveScores(text) {
  PropertiesService.getScriptProperties().setProperty('DATA_SCORES', text);
  return "Cập nhật thành công!";
}