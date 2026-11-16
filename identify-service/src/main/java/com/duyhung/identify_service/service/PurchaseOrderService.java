package com.duyhung.identify_service.service;

import com.duyhung.identify_service.dto.request.PurchaseOrderRequest;
import com.duyhung.identify_service.dto.response.PurchaseOrderResponse;
import com.duyhung.identify_service.dto.response.VoucherQuoteResponse;
import com.duyhung.identify_service.entity.*;
import com.duyhung.identify_service.enums.*;
import com.duyhung.identify_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {
    private final PurchaseOrderRepository orders;
    private final UserRepository users;
    private final MedicineRepository medicines;
    private final VoucherService voucherService;
    private final OrderDiscountRepository discounts;
    private final VoucherRepository vouchers;

    @Transactional
    public PurchaseOrderResponse create(PurchaseOrderRequest request) {
        User user = currentUser();
        ShippingMethod shipping = parse(ShippingMethod.class, request.getShippingMethod(), "Hình thức nhận hàng không hợp lệ");
        PaymentMethod payment = parse(PaymentMethod.class, request.getPaymentMethod(), "Phương thức thanh toán không hợp lệ");
        if (shipping == ShippingMethod.DELIVERY && blank(request.getAddress()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập địa chỉ giao hàng");
        if (shipping == ShippingMethod.PICKUP && blank(request.getPickupStore()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn nhà thuốc nhận hàng");

        Map<String, Integer> quantities = new TreeMap<>();
        for (PurchaseOrderRequest.Item item : request.getItems())
            quantities.merge(item.getMedicineId(), item.getQuantity(), Integer::sum);

        PurchaseOrder order = PurchaseOrder.builder().user(user).status(OrderStatus.PENDING)
                .paymentMethod(payment).paymentStatus(payment == PaymentMethod.QR ? PaymentStatus.PENDING : PaymentStatus.UNPAID)
                .shippingMethod(shipping).recipientName(request.getRecipientName().trim()).phone(request.getPhone().trim())
                .province(clean(request.getProvince())).district(clean(request.getDistrict())).address(clean(request.getAddress()))
                .pickupStore(clean(request.getPickupStore())).note(clean(request.getNote())).total(0).build();

        user.setPhone(request.getPhone().trim());
        if (shipping == ShippingMethod.DELIVERY) {
            String profileAddress = String.join(", ", java.util.stream.Stream.of(
                    request.getAddress(), request.getDistrict(), request.getProvince())
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim).toList());
            user.setAddress(profileAddress.length() > 255 ? profileAddress.substring(0, 255) : profileAddress);
        }
        users.save(user);

        long total = 0;
        for (var entry : quantities.entrySet()) {
            Medicine medicine = medicines.lockById(entry.getKey()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Một sản phẩm trong giỏ không còn tồn tại"));
            int quantity = entry.getValue();
            if (medicine.getStock() < quantity)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Sản phẩm “" + medicine.getName() + "” chỉ còn " + medicine.getStock() + " sản phẩm");
            medicine.setStock(medicine.getStock() - quantity);
            total = Math.addExact(total, Math.multiplyExact(medicine.getPrice(), quantity));
            order.addItem(PurchaseOrderItem.builder().medicineId(medicine.getId()).medicineName(medicine.getName())
                    .unitPrice(medicine.getPrice()).quantity(quantity).build());
        }
        long discount = 0;
        VoucherQuoteResponse quote = null;
        if (!blank(request.getVoucherCode())) {
            quote = voucherService.redeem(request.getVoucherCode(), total);
            discount = quote.discount();
        }
        order.setTotal(total - discount);
        PurchaseOrder saved = orders.saveAndFlush(order);
        if (quote != null) {
            discounts.save(OrderDiscount.builder().orderId(saved.getId()).voucher(vouchers.getReferenceById(quote.code()))
                    .subtotal(java.math.BigDecimal.valueOf(total))
                    .discountAmount(java.math.BigDecimal.valueOf(discount)).build());
        }
        return response(saved);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> mine() {
        String userId = currentUser().getId();
        return orders.findByUser_IdOrderByCreatedAtDesc(userId).stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> allForStaff() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(this::response).toList();
    }

    @Transactional
    public PurchaseOrderResponse detailForStaff(String id) {
        return response(findOrder(id));
    }

    @Transactional
    public PurchaseOrderResponse updateStatus(String id, String requestedStatus) {
        PurchaseOrder order = findOrder(id);
        OrderStatus next = parse(OrderStatus.class, requestedStatus, "Trạng thái đơn hàng không hợp lệ");
        OrderStatus expected = switch (order.getStatus()) {
            case PENDING -> OrderStatus.CONFIRMED;
            case CONFIRMED -> order.getShippingMethod() == ShippingMethod.PICKUP ? OrderStatus.READY_FOR_PICKUP : OrderStatus.SHIPPING;
            case READY_FOR_PICKUP -> OrderStatus.PICKED_UP;
            case SHIPPING -> OrderStatus.DELIVERED;
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng đã kết thúc, không thể cập nhật trạng thái");
        };
        if (next != expected)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái tiếp theo hợp lệ là: " + expected);
        if (order.getPaymentMethod() == PaymentMethod.QR && order.getPaymentStatus() != PaymentStatus.PAID)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn QR cần được thanh toán trước khi xác nhận");
        if (next == OrderStatus.DELIVERED || next == OrderStatus.PICKED_UP) {
            if (order.getPaymentMethod() == PaymentMethod.CASH) recordPayment(order);
        }
        order.setStatus(next);
        return response(orders.save(order));
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse detail(String id) {
        return response(findOwned(id));
    }

    @Transactional
    public PurchaseOrderResponse cancel(String id) {
        PurchaseOrder order = findOrder(id);
        if (!order.getUser().getId().equals(currentUser().getId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (order.getStatus() != OrderStatus.PENDING || order.getPaymentStatus() == PaymentStatus.PAID)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng không còn ở trạng thái chờ xác nhận nên không thể hủy");
        order.setStatus(OrderStatus.CANCELLED);
        restoreStock(order);
        return response(orders.save(order));
    }

    @Transactional
    public PurchaseOrderResponse confirmQrPayment(String id) {
        PurchaseOrder order = findOrder(id);
        if (order.getCreatedAt().plusMinutes(15).isBefore(java.time.LocalDateTime.now())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Đã hết thời gian thanh toán");
        if (order.getPaymentMethod() != PaymentMethod.QR || order.getStatus() != OrderStatus.PENDING || order.getPaymentStatus() != PaymentStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn này không chờ thanh toán QR");
        recordPayment(order);
        order.setStatus(OrderStatus.CONFIRMED);
        return response(orders.save(order));
    }

    private PurchaseOrder findOwned(String id) {
        return orders.findByIdAndUser_Id(id, currentUser().getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    }

    private PurchaseOrder findOrder(String id) {
        return orders.lockById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void recordPayment(PurchaseOrder order) {
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(java.time.LocalDateTime.now());
        order.setPaymentConfirmedBy(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    private void restoreStock(PurchaseOrder order) {
        discounts.findById(order.getId()).ifPresent(d -> voucherService.release(d.getVoucher().getCode()));
        order.getItems().stream().sorted(Comparator.comparing(PurchaseOrderItem::getMedicineId)).forEach(item ->
            medicines.lockById(item.getMedicineId()).ifPresent(m -> m.setStock(Math.addExact(m.getStock(), item.getQuantity()))));
    }

    @Transactional
    public void expireUnpaidOrders() {
        var cutoff = java.time.LocalDateTime.now().minusMinutes(15);
        for (PurchaseOrder candidate : orders.findByPaymentMethodAndPaymentStatusAndStatusAndCreatedAtBefore(PaymentMethod.QR, PaymentStatus.PENDING, OrderStatus.PENDING, cutoff)) {
            PurchaseOrder order = findOrder(candidate.getId());
            if (order.getStatus() == OrderStatus.PENDING && order.getPaymentStatus() == PaymentStatus.PENDING) {
                order.setStatus(OrderStatus.CANCELLED);
                restoreStock(order);
            }
        }
    }

    private PurchaseOrderResponse response(PurchaseOrder order) {
        OrderDiscount discount = discounts.findById(order.getId()).orElse(null);
        long subtotal = order.getItems().stream().mapToLong(i -> i.getUnitPrice() * i.getQuantity()).sum();
        return new PurchaseOrderResponse(order.getId(), order.getStatus(), order.getPaymentMethod(), order.getPaymentStatus(),
                order.getShippingMethod(), order.getRecipientName(), order.getPhone(), order.getProvince(), order.getDistrict(),
                order.getAddress(), order.getPickupStore(), order.getNote(), order.getTotal(), order.getCreatedAt(),
                subtotal, discount == null ? null : discount.getVoucher().getCode(), discount == null ? 0 : discount.getDiscountAmount().longValue(),
                order.getPaidAt(), order.getPaymentConfirmedBy(), order.getPaymentMethod() == PaymentMethod.QR ? order.getCreatedAt().plusMinutes(15) : null,
                order.getItems().stream().map(item -> new PurchaseOrderResponse.Item(item.getMedicineId(), item.getMedicineName(), item.getUnitPrice(), item.getQuantity())).toList());
    }

    private <T extends Enum<T>> T parse(Class<T> type, String value, String message) {
        try { return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT)); }
        catch (Exception ignored) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
