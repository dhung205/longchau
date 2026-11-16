package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.OrderDiscount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDiscountRepository extends JpaRepository<OrderDiscount, String> {
}
