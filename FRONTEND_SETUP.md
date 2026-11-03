# Identify frontend setup

The Spring Boot application serves the login page from `src/main/resources/static/index.html` at `http://localhost:8080/identify/`.

Set these environment variables before starting the backend:

```text
DB_URL=jdbc:mysql://localhost:3306/identify_service
DB_USERNAME=root
DB_PASSWORD=root
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
```

After Google finishes authentication, the backend returns the one-time login ticket to the frontend on the same host, port, and `/identify/` context path that handled the callback. No `OAUTH2_REDIRECT_URI` setting is needed.

In Google Cloud Console, add this authorized redirect URI:

```text
http://localhost:8080/identify/login/oauth2/code/google
```

The page calls the existing password login endpoint and the one-time OAuth code exchange endpoint on the same origin. It keeps the JWT in page memory and calls the logout endpoint when the user signs out.
