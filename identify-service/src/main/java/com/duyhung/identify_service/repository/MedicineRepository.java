package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Medicine m where m.id = :id")
    java.util.Optional<Medicine> lockById(@org.springframework.data.repository.query.Param("id") String id);
    List<Medicine> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
