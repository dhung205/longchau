package com.duyhung.identify_service.service;
import com.duyhung.identify_service.entity.*;
import com.duyhung.identify_service.enums.*;
import com.duyhung.identify_service.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.time.LocalDateTime;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class PurchaseOrderServiceTest {
 PurchaseOrderRepository orders = mock(PurchaseOrderRepository.class);
 MedicineRepository medicines = mock(MedicineRepository.class);
 OrderDiscountRepository discounts = mock(OrderDiscountRepository.class);
 PurchaseOrderService service = new PurchaseOrderService(orders, mock(UserRepository.class), medicines, mock(VoucherService.class), discounts, mock(VoucherRepository.class));
 PurchaseOrder order;
 @BeforeEach void setup() {
  order = PurchaseOrder.builder().id("order").status(OrderStatus.CONFIRMED).shippingMethod(ShippingMethod.PICKUP).paymentMethod(PaymentMethod.CASH).paymentStatus(PaymentStatus.UNPAID).createdAt(LocalDateTime.now()).build();
  when(orders.lockById("order")).thenReturn(Optional.of(order));
  when(orders.save(any())).thenAnswer(i -> i.getArgument(0));
  when(discounts.findById("order")).thenReturn(Optional.empty());
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("staff", ""));
 }
 @AfterEach void clear() { SecurityContextHolder.clearContext(); }
 @Test void pickupCollectsCashOnlyWhenHandedOver() {
  assertEquals(OrderStatus.READY_FOR_PICKUP, service.updateStatus("order", "READY_FOR_PICKUP").status());
  assertEquals(PaymentStatus.UNPAID, order.getPaymentStatus());
  var response = service.updateStatus("order", "PICKED_UP");
  assertEquals(PaymentStatus.PAID, response.paymentStatus()); assertNotNull(response.paidAt()); assertEquals("staff", response.paymentConfirmedBy());
 }
 @Test void expiredQrCannotBeConfirmed() {
  order.setPaymentMethod(PaymentMethod.QR); order.setPaymentStatus(PaymentStatus.PENDING); order.setStatus(OrderStatus.PENDING); order.setCreatedAt(LocalDateTime.now().minusMinutes(16));
  assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.confirmQrPayment("order"));
  assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
 }
 @Test void expiryRestoresStockOnce() {
  order.setPaymentMethod(PaymentMethod.QR); order.setPaymentStatus(PaymentStatus.PENDING); order.setStatus(OrderStatus.PENDING);
  order.addItem(PurchaseOrderItem.builder().medicineId("m").quantity(2).unitPrice(100).build());
  Medicine medicine = new Medicine(); medicine.setStock(3);
  when(medicines.lockById("m")).thenReturn(Optional.of(medicine));
  when(orders.findByPaymentMethodAndPaymentStatusAndStatusAndCreatedAtBefore(any(),any(),any(),any())).thenReturn(List.of(order));
  service.expireUnpaidOrders(); service.expireUnpaidOrders();
  assertEquals(5, medicine.getStock()); assertEquals(OrderStatus.CANCELLED, order.getStatus());
 }
}
