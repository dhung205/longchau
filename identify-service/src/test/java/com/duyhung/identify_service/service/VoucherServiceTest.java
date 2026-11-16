package com.duyhung.identify_service.service;
import com.duyhung.identify_service.entity.Voucher;
import com.duyhung.identify_service.repository.VoucherRepository;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class VoucherServiceTest {
 VoucherRepository repo = mock(VoucherRepository.class); VoucherService service = new VoucherService(repo);
 Voucher voucher;
 @BeforeEach void setup() {
  voucher = Voucher.builder().code("TEST").title("Test").active(true).minimumSubtotal(BigDecimal.ZERO).percent(BigDecimal.TEN).amount(BigDecimal.ZERO).maximumDiscount(BigDecimal.valueOf(20000)).usageLimit(1).build();
  when(repo.findById("TEST")).thenReturn(Optional.of(voucher)); when(repo.lockByCode("TEST")).thenReturn(Optional.of(voucher));
 }
 @Test void discountIsCapped() { assertEquals(20000, service.validate("TEST", 500000).discount()); }
 @Test void redeemedVoucherCannotExceedLimit() { service.redeem("TEST", 100000); assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.redeem("TEST", 100000)); assertEquals(1, voucher.getUsedCount()); }
 @Test void cancellingReleasesUsage() { service.redeem("TEST",100000); service.release("TEST"); assertEquals(0,voucher.getUsedCount()); assertEquals(10000,service.validate("TEST",100000).discount()); }
 @Test void expiredVoucherIsRejected() { voucher.setExpiresAt(LocalDateTime.now().minusSeconds(1)); assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.validate("TEST",100000)); }
 @Test void futureVoucherIsHidden() { voucher.setStartsAt(LocalDateTime.now().plusDays(1)); when(repo.findAllByActiveTrueOrderByCodeAsc()).thenReturn(List.of(voucher)); assertTrue(service.available(100000).isEmpty()); }
 @Test void cannotEnableTwoDiscountTypes() { voucher.setAmount(BigDecimal.TEN); assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.save("TEST",voucher,false)); }
}
