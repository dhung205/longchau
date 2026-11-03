package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "token_bi_vo_hieu_hoa")
public class InvalidatedToken {
    @Id
    @Column(name = "ma_jti", length = 80)
    String id;
    @Column(name = "het_han_luc")
    Date expiryTime;
}
