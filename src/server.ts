import { serve } from "bun";
import * as jose from "jose";
import index from "./index.html";

const secret = new TextEncoder().encode("super_secret_key");

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/auth/sign-in": {
      async POST(req) {
        const { username, password } = await req.json();

        // Validate credentials

        const signJwt = new jose.SignJWT({ username }).setProtectedHeader({
          alg: "HS256",
        });

        return Response.json({
          accessToken: await signJwt.setExpirationTime("15m").sign(secret),
          refreshToken: await signJwt.setExpirationTime("7d").sign(secret),
        });
      },
    },

    "/api/auth/sign-up": {
      async POST(req) {
        const { username, password } = await req.json();

        // Create user

        const signJwt = new jose.SignJWT({ username }).setProtectedHeader({
          alg: "HS256",
        });

        return Response.json({
          accessToken: await signJwt.setExpirationTime("15m").sign(secret),
          refreshToken: await signJwt.setExpirationTime("7d").sign(secret),
        });
      },
    },

    "/api/auth/refresh": {
      async POST(req) {
        const { refreshToken } = await req.json();

        try {
          const { payload } = await jose.jwtVerify(refreshToken, secret, {
            algorithms: ["HS256"],
          });

          const { username } = payload as { username: string };

          const token = await new jose.SignJWT({ username })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("15m")
            .sign(secret);

          return Response.json({
            accessToken: token,
          });
        } catch (e) {
          return new Response("Invalid refresh token", { status: 401 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
