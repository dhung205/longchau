-- Chạy một lần trước khi khởi động phiên bản mới (ddl-auto=validate).
ALTER TABLE don_hang ADD COLUMN nguoi_xac_nhan_thanh_toan VARCHAR(255) NULL;
-- trang_thai phải là VARCHAR để hỗ trợ READY_FOR_PICKUP và PICKED_UP.
ALTER TABLE don_hang MODIFY COLUMN trang_thai VARCHAR(30) NOT NULL;
