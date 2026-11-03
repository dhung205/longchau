package com.duyhung.identify_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "quyen")
public class Permission {
    @Id
    @Column(name = "ma_quyen", length = 80)
    String name;

    @Column(name = "ten_quyen", length = 255)
    String description;

}
