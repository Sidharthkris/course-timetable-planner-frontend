package com.portfolio.timetable.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * A small addition made specifically to support the React frontend.
 * The backend authenticates via HTTP Basic — there's no login endpoint
 * that returns a token or session artifact, so the SPA has no way to
 * know who's logged in or which role they hold after "signing in"
 * (storing credentials locally). This endpoint answers exactly that:
 * given the credentials already attached to the request, who is this,
 * and what can they do.
 *
 * <p>No changes to {@code SecurityConfig} were needed to add this — it
 * falls under {@code /api/**}, which the existing config already
 * exempts from CSRF and requires authentication for via
 * {@code anyRequest().authenticated()}. Both the session-based form
 * login and HTTP Basic already populate {@link Authentication} the
 * same way for any {@code /api/**} controller, this one included.
 */
@RestController
@RequestMapping("/api/me")
@Tag(name = "Current User", description = "Identifies the authenticated user — used by the React frontend to know who's logged in and which role they hold")
public class CurrentUserController {

    @GetMapping
    @Operation(summary = "Get the current authenticated user's username and roles")
    public CurrentUserResponse me(Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        return new CurrentUserResponse(authentication.getName(), roles);
    }

    public record CurrentUserResponse(String username, List<String> roles) {
    }
}
