package com.duyhung.identify_service.service;

import com.duyhung.identify_service.dto.response.VoucherQuoteResponse;
import com.duyhung.identify_service.entity.Voucher;
import com.duyhung.identify_service.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class VoucherService {
    private final VoucherRepository vouchers;

    @Transactional(readOnly = true)
    public List<VoucherQuoteResponse> available(long subtotal) {
        if (subtotal < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tạm tính không hợp lệ");
        return vouchers.findAllByActiveTrueOrderByCodeAsc().stream()
                .filter(this::usable)
                .filter(v -> BigDecimal.valueOf(subtotal).compareTo(v.getMinimumSubtotal()) >= 0)
                .map(v -> quote(v, subtotal)).toList();
    }

    @Transactional(readOnly = true)
    public VoucherQuoteResponse validate(String rawCode, long subtotal) {
        if (subtotal < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tạm tính không hợp lệ");
        String code = rawCode == null ? "" : rawCode.trim().toUpperCase(Locale.ROOT);
        Voucher voucher = vouchers.findById(code).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Mã voucher không tồn tại hoặc đã hết hạn"));
        if (!usable(voucher)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher chưa có hiệu lực, hết hạn hoặc hết lượt sử dụng");
        if (!voucher.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher đã ngừng áp dụng");
        if (BigDecimal.valueOf(subtotal).compareTo(voucher.getMinimumSubtotal()) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng chưa đạt giá trị tối thiểu của voucher");
        return quote(voucher, subtotal);
    }

    private boolean usable(Voucher v) {
        var now = java.time.LocalDateTime.now();
        return v.isActive() && (v.getStartsAt() == null || !now.isBefore(v.getStartsAt()))
            && (v.getExpiresAt() == null || now.isBefore(v.getExpiresAt()))
            && (v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit());
    }

    @Transactional
    public VoucherQuoteResponse redeem(String code, long subtotal) {
        Voucher v = vouchers.lockByCode(code.trim().toUpperCase(Locale.ROOT)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher"));
        VoucherQuoteResponse result = validate(v.getCode(), subtotal);
        v.setUsedCount(Math.addExact(v.getUsedCount(), 1));
        return result;
    }

    @Transactional
    public void release(String code) {
        vouchers.lockByCode(code).ifPresent(v -> v.setUsedCount(Math.max(0, v.getUsedCount() - 1)));
    }

    public List<Voucher> manage() { return vouchers.findAllByOrderByCodeAsc(); }

    @Transactional
    public Voucher save(String code, Voucher input, boolean creating) {
        code = code.trim().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9_-]{1,40}") || input.getTitle() == null || input.getTitle().isBlank() || input.getTitle().length() > 255
            || input.getMinimumSubtotal() == null || input.getMinimumSubtotal().signum() < 0
            || input.getPercent() == null || input.getPercent().signum() < 0 || input.getPercent().compareTo(BigDecimal.valueOf(100)) > 0
            || input.getAmount() == null || input.getAmount().signum() < 0
            || (input.getPercent().signum() > 0) == (input.getAmount().signum() > 0)
            || input.getMaximumDiscount() != null && input.getMaximumDiscount().signum() <= 0
            || input.getUsageLimit() != null && input.getUsageLimit() < 1
            || input.getStartsAt() != null && input.getExpiresAt() != null && !input.getExpiresAt().isAfter(input.getStartsAt()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin voucher không hợp lệ. Chọn giảm phần trăm hoặc số tiền, nhập giới hạn và thời hạn hợp lệ.");
        Voucher existing = vouchers.lockByCode(code).orElse(null);
        if (creating && existing != null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã voucher đã tồn tại");
        if (!creating && existing == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher");
        int used = existing == null ? 0 : existing.getUsedCount();
        if (input.getUsageLimit() != null && input.getUsageLimit() < used) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giới hạn không được nhỏ hơn số lượt đã dùng");
        input.setCode(code); input.setUsedCount(used);
        if (existing != null) {
            existing.setTitle(input.getTitle().trim()); existing.setMinimumSubtotal(input.getMinimumSubtotal()); existing.setPercent(input.getPercent()); existing.setAmount(input.getAmount()); existing.setActive(input.isActive());
            existing.setStartsAt(input.getStartsAt()); existing.setExpiresAt(input.getExpiresAt()); existing.setUsageLimit(input.getUsageLimit()); existing.setMaximumDiscount(input.getMaximumDiscount());
            return existing;
        }
        return vouchers.save(input);
    }

    private VoucherQuoteResponse quote(Voucher voucher, long subtotal) {
        BigDecimal base = BigDecimal.valueOf(subtotal);
        BigDecimal discount = voucher.getPercent().signum() > 0
                ? base.multiply(voucher.getPercent()).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN)
                : voucher.getAmount();
        if (voucher.getMaximumDiscount() != null) discount = discount.min(voucher.getMaximumDiscount());
        long off = discount.min(base).max(BigDecimal.ZERO).setScale(0, RoundingMode.DOWN).longValue();
        return new VoucherQuoteResponse(voucher.getCode(), voucher.getTitle(), subtotal, off, subtotal - off,
                voucher.getMinimumSubtotal(), voucher.getPercent(), voucher.getAmount());
    }
}
