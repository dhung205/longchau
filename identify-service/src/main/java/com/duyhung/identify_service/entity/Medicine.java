package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "thuoc")
public class Medicine {
    @Id
    @Column(name = "ma_thuoc", length = 36)
    private String id;
    @Column(name = "ten_thuoc", nullable = false, length = 255, unique = true)
    private String name;
    @Column(name = "thanh_phan", length = 200)
    private String ingredient;
    @Column(name = "loai_thuoc", length = 120)
    private String category;
    @Column(name = "han_su_dung", nullable = false)
    private LocalDate expiryDate;
    @Column(name = "gia_ban", nullable = false, columnDefinition = "DECIMAL(12,0)")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    private long price;
    @Column(name = "so_luong_ton", nullable = false)
    private int stock = 0;
    @Column(name = "mo_ta", nullable = false, length = 2000)
    private String functionText;
    @Column(name = "khuyen_nghi", length = 2000)
    private String recommendation;
    @Column(name = "hinh_anh", length = 500000)
    private String imageData;
    @Column(name = "ngay_tao")
    private LocalDateTime createdAt;

    @PrePersist
    void init() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }


}
