package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tu_van")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Consultation {
    @Id
    @Column(name = "ma_tu_van", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khach_hang")
    private User customer;

    @Column(name = "cau_hoi", nullable = false, length = 1000)
    private String question;

    // Existing LONGTEXT column stores an opaque disk reference and encoded original filename.
    @Column(name = "anh_cau_hoi", columnDefinition = "LONGTEXT")
    private String attachmentRef;

    @Column(name = "cau_tra_loi", length = 1000)
    private String answer;

    @Column(name = "trang_thai", nullable = false, length = 20)
    private String status;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void initialize() {
        if (id == null) id = UUID.randomUUID().toString();
        if (status == null) status = "PENDING";
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
