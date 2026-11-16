-- Chạy một lần trên database hiện tại trước khi khởi động ứng dụng.
ALTER TABLE khuyen_mai
 ADD COLUMN bat_dau_luc DATETIME NULL,
 ADD COLUMN ket_thuc_luc DATETIME NULL,
 ADD COLUMN gioi_han_luot INT NULL,
 ADD COLUMN da_su_dung INT NOT NULL DEFAULT 0,
 ADD COLUMN giam_toi_da DECIMAL(15,2) NULL;
-- Đồng bộ lượt đã sử dụng từ đơn chưa hủy.
UPDATE khuyen_mai k SET da_su_dung = (SELECT COUNT(*) FROM giam_gia_don_hang g JOIN don_hang d ON d.ma_don_hang = g.ma_don_hang WHERE g.ma_khuyen_mai = k.ma_khuyen_mai AND d.trang_thai <> 'CANCELLED');
