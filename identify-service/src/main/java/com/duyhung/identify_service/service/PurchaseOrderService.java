package com.duyhung.identify_service.service;

import com.duyhung.identify_service.dto.request.PurchaseOrderRequest;
import com.duyhung.identify_service.dto.response.PurchaseOrderResponse;
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

    @Transactional
    public PurchaseOrderResponse create(PurchaseOrderRequest request) {
        User user = currentUser();
        ShippingMethod shipping = parse(ShippingMethod.class, request.getShippingMethod(), "Hình thức nhận hàng không hợp lệ");
        PaymentMethod payment = parse(PaymentMethod.class, request.getPaymentMethod(), "Phương thức thanh toán không hợp lệ");
        if (shipping == ShippingMethod.DELIVERY && blank(request.getAddress()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập địa chỉ giao hàng");
        if (shipping == ShippingMethod.PICKUP && blank(request.getPickupStore()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn nhà thuốc nhận hàng");

        Map<String, Integer> quantities = new LinkedHashMap<>();
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
            Medicine medicine = medicines.findById(entry.getKey()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Một sản phẩm trong giỏ không còn tồn tại"));
            int quantity = entry.getValue();
            if (medicine.getStock() < quantity)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Sản phẩm “" + medicine.getName() + "” chỉ còn " + medicine.getStock() + " sản phẩm");
            medicine.setStock(medicine.getStock() - quantity);
            total = Math.addExact(total, Math.multiplyExact(medicine.getPrice(), quantity));
            order.addItem(PurchaseOrderItem.builder().medicineId(medicine.getId()).medicineName(medicine.getName())
                    .unitPrice(medicine.getPrice()).quantity(quantity).build());
        }
        order.setTotal(total);
        return response(orders.save(order));
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

    @Transactional(readOnly = true)
    public PurchaseOrderResponse detailForStaff(String id) {
        return response(findOrder(id));
    }

    @Transactional
    public PurchaseOrderResponse updateStatus(String id, String requestedStatus) {
        PurchaseOrder order = findOrder(id);
        OrderStatus next = parse(OrderStatus.class, requestedStatus, "Trạng thái đơn hàng không hợp lệ");
        OrderStatus expected = switch (order.getStatus()) {
            case PENDING -> OrderStatus.CONFIRMED;
            case CONFIRMED -> OrderStatus.SHIPPING;
            case SHIPPING -> OrderStatus.DELIVERED;
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng đã kết thúc, không thể cập nhật trạng thái");
        };
        if (next != expected)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái tiếp theo hợp lệ là: " + expected);
        if (order.getPaymentMethod() == PaymentMethod.QR && order.getPaymentStatus() != PaymentStatus.PAID)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn QR cần được thanh toán trước khi xác nhận");
        order.setStatus(next);
        return response(orders.save(order));
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse detail(String id) {
        return response(findOwned(id));
    }

    @Transactional
    public PurchaseOrderResponse cancel(String id) {
        PurchaseOrder order = findOwned(id);
        if (order.getStatus() != OrderStatus.PENDING || order.getPaymentStatus() == PaymentStatus.PAID)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng không còn ở trạng thái chờ xác nhận nên không thể hủy");
        order.setStatus(OrderStatus.CANCELLED);
        List<String> medicineIds = order.getItems().stream().map(PurchaseOrderItem::getMedicineId).toList();
        Map<String, Medicine> byId = new HashMap<>();
        medicines.findAllById(medicineIds).forEach(medicine -> byId.put(medicine.getId(), medicine));
        order.getItems().forEach(item -> {
            Medicine medicine = byId.get(item.getMedicineId());
            if (medicine != null) medicine.setStock(medicine.getStock() + item.getQuantity());
        });
        return response(orders.save(order));
    }

    @Transactional
    public PurchaseOrderResponse confirmQrPayment(String id) {
        PurchaseOrder order = findOwned(id);
        if (order.getPaymentMethod() != PaymentMethod.QR || order.getStatus() != OrderStatus.PENDING || order.getPaymentStatus() != PaymentStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn này không chờ thanh toán QR");
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.CONFIRMED);
        return response(orders.save(order));
    }

    private PurchaseOrder findOwned(String id) {
        return orders.findByIdAndUser_Id(id, currentUser().getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    }

    private PurchaseOrder findOrder(String id) {
        return orders.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private PurchaseOrderResponse response(PurchaseOrder order) {
        return new PurchaseOrderResponse(order.getId(), order.getStatus(), order.getPaymentMethod(), order.getPaymentStatus(),
                order.getShippingMethod(), order.getRecipientName(), order.getPhone(), order.getProvince(), order.getDistrict(),
                order.getAddress(), order.getPickupStore(), order.getNote(), order.getTotal(), order.getCreatedAt(),
                order.getItems().stream().map(item -> new PurchaseOrderResponse.Item(item.getMedicineId(), item.getMedicineName(), item.getUnitPrice(), item.getQuantity())).toList());
    }

    private <T extends Enum<T>> T parse(Class<T> type, String value, String message) {
        try { return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT)); }
        catch (Exception ignored) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
