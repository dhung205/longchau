package com.duyhung.identify_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "khuyen_mai")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {
    @Id
    @Column(name = "ma_khuyen_mai", length = 40)
    private String code;

    @Column(name = "ten_khuyen_mai", nullable = false, length = 255)
    private String title;

    @Column(name = "gia_tri_don_toi_thieu", nullable = false, precision = 15, scale = 2)
    private BigDecimal minimumSubtotal;

    @Column(name = "phan_tram_giam", nullable = false, precision = 5, scale = 2)
    private BigDecimal percent;

    @Column(name = "so_tien_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "dang_ap_dung", nullable = false)
    private boolean active;
    @Column(name = "bat_dau_luc")
    private java.time.LocalDateTime startsAt;
    @Column(name = "ket_thuc_luc")
    private java.time.LocalDateTime expiresAt;
    @Column(name = "gioi_han_luot")
    private Integer usageLimit;
    @Column(name = "da_su_dung", nullable = false)
    private int usedCount;
    @Column(name = "giam_toi_da", precision = 15, scale = 2)
    private BigDecimal maximumDiscount;
}
