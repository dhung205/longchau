-- Chạy trên database nhà thuốc hiện tại. Giữ nguyên voucher đã tồn tại.
SET NAMES utf8mb4;
INSERT INTO khuyen_mai
(ma_khuyen_mai, ten_khuyen_mai, gia_tri_don_toi_thieu, phan_tram_giam, so_tien_giam, dang_ap_dung)
VALUES
('CHAOMUNG10', 'Chào mừng giảm 10%', 0, 10, 0, 1),
('GIAM20K', 'Giảm 20.000đ cho đơn từ 200.000đ', 200000, 0, 20000, 1),
('GIAM50K', 'Giảm 50.000đ cho đơn từ 500.000đ', 500000, 0, 50000, 1),
('SONGKHOE15', 'Sống khỏe giảm 15%', 300000, 15, 0, 1),
('GIAM100K', 'Giảm 100.000đ cho đơn từ 1.000.000đ', 1000000, 0, 100000, 1)
ON DUPLICATE KEY UPDATE ma_khuyen_mai = khuyen_mai.ma_khuyen_mai;
