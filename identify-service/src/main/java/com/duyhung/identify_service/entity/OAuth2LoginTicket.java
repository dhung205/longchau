package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "ve_dang_nhap_oauth2")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OAuth2LoginTicket {
    @Id
    @Column(name = "ma_ve", length = 64)
    String id;
    @Column(name = "ma_tai_khoan", nullable = false, length = 36)
    String userId;
    @Column(name = "het_han_luc", nullable = false)
    Instant expiresAt;
}
