package com.duyhung.identify_service.entity;

import com.duyhung.identify_service.enums.OrderStatus;
import com.duyhung.identify_service.enums.PaymentMethod;
import com.duyhung.identify_service.enums.PaymentStatus;
import com.duyhung.identify_service.enums.ShippingMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "don_hang")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrder {
    @Id
    @Column(name = "ma_don_hang", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ma_khach_hang", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 30)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "phuong_thuc_thanh_toan", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_thanh_toan", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "phuong_thuc_nhan_hang", nullable = false, length = 24)
    private ShippingMethod shippingMethod;

    @Column(name = "ten_nguoi_nhan", nullable = false, length = 160)
    private String recipientName;

    @Column(name = "so_dien_thoai_nhan", nullable = false, length = 30)
    private String phone;

    @Column(name = "tinh_thanh", length = 100)
    private String province;

    @Column(name = "quan_huyen", length = 100)
    private String district;

    @Column(name = "dia_chi_giao_hang", length = 500)
    private String address;

    @Column(name = "nha_thuoc_nhan", length = 250)
    private String pickupStore;

    @Column(name = "ghi_chu", length = 500)
    private String note;

    @Column(name = "tong_tien", nullable = false, columnDefinition = "DECIMAL(14,0)")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    private long total;

    @Column(name = "ngay_lap", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @PrePersist
    void initialize() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public void addItem(PurchaseOrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
