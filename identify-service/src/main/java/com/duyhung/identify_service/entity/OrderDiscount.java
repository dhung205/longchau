package com.duyhung.identify_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "giam_gia_don_hang")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDiscount {
    @Id
    @Column(name = "ma_don_hang", length = 36)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ma_don_hang", insertable = false, updatable = false)
    private PurchaseOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ma_khuyen_mai", nullable = false)
    private Voucher voucher;

    @Column(name = "tien_truoc_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "so_tien_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;
}
