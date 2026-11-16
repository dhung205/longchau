package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from Voucher v where v.code = :code")
    java.util.Optional<Voucher> lockByCode(@org.springframework.data.repository.query.Param("code") String code);
    List<Voucher> findAllByOrderByCodeAsc();
    List<Voucher> findAllByActiveTrueOrderByCodeAsc();
}
