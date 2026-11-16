package com.duyhung.identify_service.configuration;

import com.duyhung.identify_service.entity.Voucher;
import com.duyhung.identify_service.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.math.BigDecimal;

@Configuration
@RequiredArgsConstructor
public class VoucherSeedConfig {
    private final VoucherRepository vouchers;
    private final DataSource dataSource;

    @Bean
    ApplicationRunner seedWelcomeVoucher() {
        return args -> {
            if (!voucherTableExists()) return;
            if (!vouchers.existsById("CHAOMUNG10")) {
                vouchers.save(Voucher.builder().code("CHAOMUNG10").title("Chào mừng giảm 10%")
                        .minimumSubtotal(BigDecimal.ZERO).percent(BigDecimal.TEN)
                        .amount(BigDecimal.ZERO).active(true).build());
            }
        };
    }

    private boolean voucherTableExists() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            ResultSet tables = connection.getMetaData().getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"});
            try (tables) {
                while (tables.next()) {
                    if ("khuyen_mai".equalsIgnoreCase(tables.getString("TABLE_NAME"))) return true;
                }
            }
        }
        return false;
    }
}
