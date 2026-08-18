# Backend addition needed for the React frontend

The frontend needs exactly **one** new thing from the backend: a way to
ask "who am I, and what role do I have?" after storing credentials
locally (there's no token-based login to decode this from, since the
backend uses HTTP Basic).

## 1. Add the file

Copy `CurrentUserController.java` into your existing backend project at:

```
src/main/java/com/portfolio/timetable/controller/CurrentUserController.java
```

That's it — **no other backend files need to change.** Specifically:

- `SecurityConfig` already exempts `/api/**` from CSRF and requires
  authentication for it via `anyRequest().authenticated()`. This new
  endpoint falls under that same rule automatically.
- `httpBasic()` is already enabled, so the frontend's `Authorization:
  Basic ...` header authenticates against this endpoint exactly like
  every other `/api/**` endpoint.
- `@PreAuthorize` isn't needed here — every authenticated user
  (coordinator or instructor) is allowed to know who they are; the role
  restriction only applies to the create/update/delete methods on the
  other services, which are untouched.

## 2. Verify

```bash
mvn test
mvn spring-boot:run -Dspring-boot.run.profiles=dev
curl -u coordinator:coordinator123 http://localhost:8080/api/me
```

Expected response:
```json
{"username":"coordinator","roles":["ROLE_COORDINATOR"]}
```

## 3. (Only if you deploy the frontend separately from the backend)

For local development, the React app's Vite dev server proxies `/api`
requests to the backend, so the browser sees everything as same-origin
and CORS never comes up. If you later deploy the built frontend to a
different origin than the backend (e.g., frontend on Vercel, backend on
a separate host) rather than serving both from the same domain, you'll
need to allow that origin explicitly. Add this to `SecurityConfig`:

```java
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("https://your-deployed-frontend.example.com"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

And reference it in the `securityFilterChain` bean:

```java
http
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
    // ... rest unchanged
```

Not needed for local development — only if frontend and backend end up
on genuinely different origins in production.
