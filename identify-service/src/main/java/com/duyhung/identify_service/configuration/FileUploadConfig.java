package com.duyhung.identify_service.configuration;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FileUploadConfig {
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        return new MultipartConfigElement("", 20L * 1024 * 1024, 21L * 1024 * 1024, 0);
    }
}