package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;


@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "vai_tro")
public class Role {
    @Id
    @Column(name = "ma_vai_tro", length = 30)
    String name;

    @Column(name = "ten_vai_tro", length = 100)
    String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "phan_quyen",
            joinColumns = @JoinColumn(name = "ma_vai_tro", referencedColumnName = "ma_vai_tro"),
            inverseJoinColumns = @JoinColumn(name = "ma_quyen", referencedColumnName = "ma_quyen"))
    Set<Permission> permissions;

}
