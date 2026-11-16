package com.duyhung.identify_service.configuration;
import com.duyhung.identify_service.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
@Configuration @EnableScheduling @RequiredArgsConstructor
public class OrderExpiryConfig {
 private final PurchaseOrderService orders;
 @Scheduled(fixedDelay = 30000) public void expire() { orders.expireUnpaidOrders(); }
}
