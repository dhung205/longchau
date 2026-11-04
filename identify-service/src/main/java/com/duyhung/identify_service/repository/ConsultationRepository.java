package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, String> {
    List<Consultation> findByCustomer_IdOrderByCreatedAtDesc(String customerId);
    List<Consultation> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
