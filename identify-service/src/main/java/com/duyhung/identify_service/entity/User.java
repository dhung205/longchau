package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;


@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "tai_khoan")
@SecondaryTable(name = "ho_so", pkJoinColumns = @PrimaryKeyJoinColumn(name = "ma_tai_khoan"))
public class User {
    @Id
    @Column(name = "ma_tai_khoan", length = 36)
    String id;
    @Column(name = "ten_dang_nhap", nullable = false, unique = true)
    String username;
    @Column(name = "mat_khau", nullable = false)
    String password;
    @Column(name = "google_id", unique = true)
    String googleId;
    @Column(name = "thu_dien_tu", table = "ho_so", unique = true, length = 150)
    String email;
    @Column(name = "so_dien_thoai", table = "ho_so", length = 50)
    String phone;
    @Column(name = "dia_chi", table = "ho_so", length = 255)
    String address;
    @Column(name = "ho", table = "ho_so", length = 120)
    String firstName;
    @Column(name = "ten", table = "ho_so", length = 120)
    String lastName;
    @Column(name = "ngay_sinh", table = "ho_so")
    LocalDate dob;
    @Column(name = "ho_ten", table = "ho_so", nullable = false, length = 255)
    String fullName;
    @Column(name = "dang_hoat_dong", nullable = false)
    @Builder.Default
    boolean active = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_vai_tro", nullable = false)
    Role primaryRole;

    @Transient
    Set<Role> roles;

    @PostLoad
    @PrePersist
    @PreUpdate
    void syncProfileAndRole() {
        if (roles != null && !roles.isEmpty()) primaryRole = roles.iterator().next();
        String composedName = String.join(" ", java.util.Arrays.asList(firstName, lastName).stream()
                .filter(value -> value != null && !value.isBlank()).toList()).trim();
        if (!composedName.isBlank()) fullName = composedName;
        if (fullName == null) fullName = "";
        if (fullName.isBlank()) fullName = username == null ? "Tài khoản" : username;
        if (id == null) id = UUID.randomUUID().toString();
        if (roles == null) roles = new HashSet<>();
        if (primaryRole != null) roles.add(primaryRole);
    }

}
