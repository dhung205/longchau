package com.duyhung.identify_service.configuration;

import com.duyhung.identify_service.repository.UserRepository;
import com.duyhung.identify_service.service.OAuth2LoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class GoogleOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final OAuth2LoginService loginService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String googleId = principal.getAttribute("sub");
        String userId = userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new ServletException("OAuth2 account was not persisted")).getId();
        String ticket = loginService.issueTicket(userId);
        response.setHeader("Referrer-Policy", "no-referrer");
        // Use an absolute URL so Spring Security cannot prepend the servlet context path twice.
        String frontendUrl = UriComponentsBuilder.newInstance()
                .scheme(request.getScheme())
                .host(request.getServerName())
                .port(request.getServerPort())
                .path(request.getContextPath())
                .path("/index.html")
                .queryParam("code", ticket)
                .build()
                .encode()
                .toUriString();
        response.sendRedirect(frontendUrl);
    }
}
