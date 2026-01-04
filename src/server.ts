import { serve } from "bun";
import * as jose from "jose";
import index from "./index.html";
import { prisma } from "prisma/db";

const secret = new TextEncoder().encode("super_secret_key");

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/auth/sign-in": {
      async POST(req) {
        const { username, password } = await req.json();

        const user = await prisma.user.findUnique({
          where: { username },
        });

        // TODO: Return JSON response
        if (!user) {
          return new Response("Invalid username or password", { status: 401 });
        }

        const isPasswordValid = await Bun.password.verify(
          password,
          user.password
        );

        // TODO: Return JSON response
        if (!isPasswordValid) {
          return new Response("Invalid username or password", { status: 401 });
        }

        const signJwt = new jose.SignJWT({
          sub: user.id.toString(),
          username,
        }).setProtectedHeader({
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

        const hash = await Bun.password.hash(password);

        const user = await prisma.user.create({
          data: {
            username,
            password: hash,
          },
        });

        // TODO: Error handling

        const signJwt = new jose.SignJWT({
          sub: user.id.toString(),
          username,
        }).setProtectedHeader({
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
