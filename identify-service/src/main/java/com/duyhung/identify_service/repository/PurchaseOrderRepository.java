package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from PurchaseOrder o where o.id = :id")
    Optional<PurchaseOrder> lockById(@org.springframework.data.repository.query.Param("id") String id);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    List<PurchaseOrder> findByPaymentMethodAndPaymentStatusAndStatusAndCreatedAtBefore(com.duyhung.identify_service.enums.PaymentMethod method, com.duyhung.identify_service.enums.PaymentStatus payment, com.duyhung.identify_service.enums.OrderStatus status, java.time.LocalDateTime cutoff);
    List<PurchaseOrder> findByUser_IdOrderByCreatedAtDesc(String userId);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
    Optional<PurchaseOrder> findByIdAndUser_Id(String id, String userId);
}
