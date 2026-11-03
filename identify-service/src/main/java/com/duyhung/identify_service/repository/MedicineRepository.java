package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, String> {
    List<Medicine> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
