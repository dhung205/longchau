package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "chi_tiet_don_hang")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrderItem {
    @Id
    @Column(name = "ma_chi_tiet", length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ma_don_hang", nullable = false)
    private PurchaseOrder order;

    @Column(name = "ma_thuoc", nullable = false, length = 36)
    private String medicineId;

    @Column(name = "ten_thuoc_snapshot", nullable = false, length = 255)
    private String medicineName;

    @Column(name = "don_gia", nullable = false, columnDefinition = "DECIMAL(12,0)")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    private long unitPrice;

    @Column(name = "so_luong", nullable = false)
    private int quantity;
}
