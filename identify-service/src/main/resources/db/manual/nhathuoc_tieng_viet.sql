-- NHÀ THUỐC LONG CHÂU: CƠ SỞ DỮ LIỆU TIẾNG VIỆT
-- Schema tiếng Việt: bảng nghiệp vụ và bảng hỗ trợ cho các tính năng hiện có.
-- Các view cuối file giữ tương thích với backend; không nhân bản dữ liệu.
-- Nhập vào database mới, không chạy đè lên dữ liệu đang sử dụng.
CREATE DATABASE IF NOT EXISTS nhathuoc_tieng_viet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nhathuoc_tieng_viet;
CREATE TABLE vai_tro (
 ma_vai_tro VARCHAR(30) PRIMARY KEY, ten_vai_tro VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro) VALUES
 ('ADMIN', 'Quản trị viên'), ('STAFF', 'Nhân viên'), ('USER', 'Khách hàng');



CREATE TABLE tai_khoan (
 ma_tai_khoan VARCHAR(36) PRIMARY KEY,
 ten_dang_nhap VARCHAR(255) NOT NULL UNIQUE,
 mat_khau VARCHAR(255) NOT NULL,
 google_id VARCHAR(255) UNIQUE,
 dang_hoat_dong TINYINT(1) NOT NULL DEFAULT 1,
 ma_vai_tro VARCHAR(30) NOT NULL DEFAULT 'USER',
 FOREIGN KEY (ma_vai_tro) REFERENCES vai_tro (ma_vai_tro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ho_so (
 ma_tai_khoan VARCHAR(36) PRIMARY KEY,
 ho_ten VARCHAR(255) NOT NULL,
 ho VARCHAR(120), ten VARCHAR(120), ngay_sinh DATE,
 so_dien_thoai VARCHAR(50), thu_dien_tu VARCHAR(150), dia_chi VARCHAR(255),
 FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan (ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE khach_hang (
 ma_tai_khoan VARCHAR(36) PRIMARY KEY,
 FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan (ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nhan_vien (
 ma_tai_khoan VARCHAR(36) PRIMARY KEY,
 chuc_vu VARCHAR(100), phong_ban VARCHAR(100), ngay_vao_lam DATE,
 FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan (ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quan_ly (
 ma_nhan_vien VARCHAR(36) PRIMARY KEY,
 FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien (ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS thuoc (
  ma_thuoc VARCHAR(36) PRIMARY KEY,
  ten_thuoc VARCHAR(255) NOT NULL UNIQUE,
  loai_thuoc VARCHAR(120) NOT NULL,
  gia_ban DECIMAL(12, 0) NOT NULL,
  so_luong_ton INT NOT NULL DEFAULT 0,
  thuong_hieu VARCHAR(100),
  don_vi_tinh VARCHAR(50) DEFAULT 'Hộp',
  han_su_dung DATE NOT NULL,
  thanh_phan VARCHAR(120),
  lieu_dung VARCHAR(120),
  nha_cung_cap VARCHAR(160),
  ton_kho_toi_thieu INT DEFAULT 20,
  dang_kinh_doanh TINYINT(1) NOT NULL DEFAULT 1,
  mo_ta VARCHAR(2000) NOT NULL,
  khuyen_nghi VARCHAR(2000),
  hinh_anh LONGTEXT,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS don_hang (
  ma_don_hang VARCHAR(36) PRIMARY KEY,
  ma_khach_hang VARCHAR(36) NOT NULL,
  ma_nhan_vien VARCHAR(36),
  ngay_lap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tong_tien DECIMAL(14, 0) NOT NULL DEFAULT 0,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  phuong_thuc_thanh_toan VARCHAR(30) NOT NULL DEFAULT 'CASH',
  trang_thai_thanh_toan VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  phuong_thuc_nhan_hang VARCHAR(24) NOT NULL DEFAULT 'DELIVERY',
  ten_nguoi_nhan VARCHAR(160) NOT NULL,
  so_dien_thoai_nhan VARCHAR(30) NOT NULL,
  tinh_thanh VARCHAR(100),
  quan_huyen VARCHAR(100),
  nha_thuoc_nhan VARCHAR(250),
  thoi_diem_thanh_toan DATETIME,
  dia_chi_giao_hang VARCHAR(500),
  ghi_chu VARCHAR(500),
  da_tru_kho TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_orders_customer FOREIGN KEY (ma_khach_hang) REFERENCES tai_khoan (ma_tai_khoan),
  CONSTRAINT fk_orders_employee FOREIGN KEY (ma_nhan_vien) REFERENCES tai_khoan (ma_tai_khoan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
  ma_chi_tiet VARCHAR(36) PRIMARY KEY,
  ma_don_hang VARCHAR(36) NOT NULL,
  ma_thuoc VARCHAR(36) NOT NULL,
  ten_thuoc_snapshot VARCHAR(255) NOT NULL,
  so_luong INT NOT NULL,
  don_gia DECIMAL(12, 0) NOT NULL,
  CONSTRAINT fk_details_order FOREIGN KEY (ma_don_hang) REFERENCES don_hang (ma_don_hang) ON DELETE CASCADE,
  CONSTRAINT fk_details_medicine FOREIGN KEY (ma_thuoc) REFERENCES thuoc (ma_thuoc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS phieu_kho (
  ma_phieu VARCHAR(36) PRIMARY KEY,
  ma_thuoc VARCHAR(36) NOT NULL,
  loai_phieu VARCHAR(20) NOT NULL, 
  so_luong INT NOT NULL,
  ton_kho_sau_giao_dich INT NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ghi_chu VARCHAR(500),
  CONSTRAINT fk_inventory_medicine FOREIGN KEY (ma_thuoc) REFERENCES thuoc (ma_thuoc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tu_van (
  ma_tu_van VARCHAR(36) PRIMARY KEY,
  ma_khach_hang VARCHAR(36),
  cau_hoi VARCHAR(1000) NOT NULL,
  anh_cau_hoi LONGTEXT,
  cau_tra_loi VARCHAR(1000),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consultations_customer FOREIGN KEY (ma_khach_hang) REFERENCES tai_khoan (ma_tai_khoan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE khuyen_mai (
 ma_khuyen_mai VARCHAR(40) PRIMARY KEY, ten_khuyen_mai VARCHAR(255) NOT NULL,
 gia_tri_don_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0,
 phan_tram_giam DECIMAL(5,2) NOT NULL DEFAULT 0,
 so_tien_giam DECIMAL(15,2) NOT NULL DEFAULT 0,
 dang_ap_dung TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE giam_gia_don_hang (
 ma_don_hang VARCHAR(36) PRIMARY KEY,
 ma_khuyen_mai VARCHAR(40) NOT NULL,
 tien_truoc_giam DECIMAL(15,2) NOT NULL,
 so_tien_giam DECIMAL(15,2) NOT NULL,
 FOREIGN KEY (ma_don_hang) REFERENCES don_hang (ma_don_hang) ON DELETE CASCADE,
 FOREIGN KEY (ma_khuyen_mai) REFERENCES khuyen_mai (ma_khuyen_mai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quyen (
 ma_quyen VARCHAR(80) PRIMARY KEY,
 ten_quyen VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE phan_quyen (
 ma_vai_tro VARCHAR(30) NOT NULL,
 ma_quyen VARCHAR(80) NOT NULL,
 PRIMARY KEY (ma_vai_tro, ma_quyen),
 FOREIGN KEY (ma_vai_tro) REFERENCES vai_tro (ma_vai_tro) ON DELETE CASCADE,
 FOREIGN KEY (ma_quyen) REFERENCES quyen (ma_quyen) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gio_hang (
 ma_tai_khoan VARCHAR(36) PRIMARY KEY,
 phien_ban BIGINT NOT NULL DEFAULT 0,
 da_chuyen_gio_cu TINYINT(1) NOT NULL DEFAULT 0,
 FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan (ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chi_tiet_gio_hang (
 ma_tai_khoan VARCHAR(36) NOT NULL,
 ma_thuoc VARCHAR(36) NOT NULL,
 so_luong INT NOT NULL,
 duoc_chon TINYINT(1) NOT NULL DEFAULT 1,
 PRIMARY KEY (ma_tai_khoan,ma_thuoc),
 FOREIGN KEY (ma_tai_khoan) REFERENCES gio_hang (ma_tai_khoan) ON DELETE CASCADE,
 FOREIGN KEY (ma_thuoc) REFERENCES thuoc (ma_thuoc),
 CHECK (so_luong > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE token_bi_vo_hieu_hoa (
 ma_jti VARCHAR(80) PRIMARY KEY,
 het_han_luc DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ve_dang_nhap_oauth2 (
 ma_ve VARCHAR(64) PRIMARY KEY,
 ma_tai_khoan VARCHAR(36) NOT NULL,
 het_han_luc DATETIME(6) NOT NULL,
 CONSTRAINT fk_oauth_ticket_account FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- VIEW TƯƠNG THÍCH CHO BACKEND
CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `roles` AS SELECT `ma_vai_tro` AS `code`, `ten_vai_tro` AS `name` FROM `vai_tro`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `accounts` AS SELECT `ma_tai_khoan` AS `id`, `ten_dang_nhap` AS `username`, `mat_khau` AS `password`, `dang_hoat_dong` AS `active`, `ma_vai_tro` AS `role` FROM `tai_khoan`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `profiles` AS SELECT `ma_tai_khoan` AS `account_id`, `ho_ten` AS `full_name`, `so_dien_thoai` AS `phone`, `thu_dien_tu` AS `email`, `dia_chi` AS `address` FROM `ho_so`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `customers` AS SELECT `ma_tai_khoan` AS `account_id` FROM `khach_hang`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `employees` AS SELECT `ma_tai_khoan` AS `account_id`, `chuc_vu` AS `position`, `phong_ban` AS `department`, `ngay_vao_lam` AS `start_date` FROM `nhan_vien`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `managers` AS SELECT `ma_nhan_vien` AS `employee_id` FROM `quan_ly`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `medicines` AS SELECT `ma_thuoc` AS `id`, `ten_thuoc` AS `name`, `loai_thuoc` AS `type`, `gia_ban` AS `price`, `so_luong_ton` AS `stock`, `thuong_hieu` AS `brand`, `don_vi_tinh` AS `unit`, `han_su_dung` AS `expiry_date`, `thanh_phan` AS `ingredient`, `lieu_dung` AS `dosage`, `nha_cung_cap` AS `supplier`, `ton_kho_toi_thieu` AS `minimum_stock`, `dang_kinh_doanh` AS `active`, `mo_ta` AS `description`, `hinh_anh` AS `image` FROM `thuoc`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `orders` AS SELECT `ma_don_hang` AS `id`, `ma_khach_hang` AS `customer_id`, `ma_nhan_vien` AS `employee_id`, `ngay_lap` AS `order_date`, `tong_tien` AS `total`, `trang_thai` AS `status`, `phuong_thuc_thanh_toan` AS `payment_method`, `trang_thai_thanh_toan` AS `payment_status`, `thoi_diem_thanh_toan` AS `paid_at`, `dia_chi_giao_hang` AS `delivery_address`, `ghi_chu` AS `note`, `da_tru_kho` AS `inventory_deducted` FROM `don_hang`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `order_details` AS SELECT `ma_chi_tiet` AS `id`, `ma_don_hang` AS `order_id`, `ma_thuoc` AS `medicine_id`, `so_luong` AS `quantity`, `don_gia` AS `price` FROM `chi_tiet_don_hang`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `inventory_transactions` AS SELECT `ma_phieu` AS `id`, `ma_thuoc` AS `medicine_id`, `loai_phieu` AS `type`, `so_luong` AS `quantity`, `ton_kho_sau_giao_dich` AS `stock_after`, `ngay_tao` AS `created_at`, `ghi_chu` AS `note` FROM `phieu_kho`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `consultations` AS SELECT `ma_tu_van` AS `id`, `ma_khach_hang` AS `customer_id`, `cau_hoi` AS `question`, `anh_cau_hoi` AS `question_image`, `cau_tra_loi` AS `answer`, `trang_thai` AS `status`, `ngay_tao` AS `created_at` FROM `tu_van`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `vouchers` AS SELECT `ma_khuyen_mai` AS `code`, `ten_khuyen_mai` AS `title`, `gia_tri_don_toi_thieu` AS `min_subtotal`, `phan_tram_giam` AS `percent`, `so_tien_giam` AS `amount`, `dang_ap_dung` AS `active` FROM `khuyen_mai`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `order_discounts` AS SELECT `ma_don_hang` AS `order_id`, `ma_khuyen_mai` AS `voucher_code`, `tien_truoc_giam` AS `subtotal`, `so_tien_giam` AS `discount_amount` FROM `giam_gia_don_hang`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `role_permissions` AS SELECT `ma_vai_tro` AS `role`, GROUP_CONCAT(`ma_quyen`) AS `permissions_json` FROM `phan_quyen` GROUP BY `ma_vai_tro`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `carts` AS SELECT `ma_tai_khoan` AS `account_id`, `phien_ban` AS `version`, `da_chuyen_gio_cu` AS `legacy_imported` FROM `gio_hang`;

CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW `cart_items` AS SELECT `ma_tai_khoan` AS `account_id`, `ma_thuoc` AS `medicine_id`, `so_luong` AS `quantity`, `duoc_chon` AS `selected` FROM `chi_tiet_gio_hang`;

CREATE VIEW users AS
 SELECT a.id,p.full_name,a.username,a.password,p.phone,p.email,p.address,
 e.position,e.department,e.start_date,a.active,a.role
 FROM accounts a JOIN profiles p ON p.account_id=a.id
 LEFT JOIN employees e ON e.account_id=a.id;


