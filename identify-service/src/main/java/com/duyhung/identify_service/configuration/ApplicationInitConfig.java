package com.duyhung.identify_service.configuration;


import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.enums.Role;
import com.duyhung.identify_service.repository.UserRepository;
import com.duyhung.identify_service.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;


import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @Bean
    @ConditionalOnProperty(prefix = "spring",
            value = "datasource.driverClassName",
            havingValue = "com.mysql.cj.jdbc.Driver"
    )
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
       log.info("Init application........");
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                var adminRole = roleRepository.findById(com.duyhung.identify_service.enums.Role.ADMIN.name())
                        .orElseGet(() -> roleRepository.save(com.duyhung.identify_service.entity.Role.builder()
                                .name(com.duyhung.identify_service.enums.Role.ADMIN.name())
                                .description("Quản trị viên")
                                .permissions(new HashSet<>())
                                .build()));
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .firstName("Quản trị")
                        .lastName("viên")
                        .roles(new HashSet<>(java.util.Set.of(adminRole)))
                        .build();

                userRepository.save(user);
                log.warn("admin user has bên cerated with default password: admin, please change it");
            }
        };
    }
}
