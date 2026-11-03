package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
    List<PurchaseOrder> findByUser_IdOrderByCreatedAtDesc(String userId);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
    Optional<PurchaseOrder> findByIdAndUser_Id(String id, String userId);
}
