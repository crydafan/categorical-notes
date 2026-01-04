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

    "/api/notes": {
      async GET(req) {
        const Authorization = req.headers.get("Authorization");
        if (!Authorization) {
          return new Response("Unauthorized", { status: 401 });
        }

        const token = Authorization.replace("Bearer ", "");

        let payload = null;

        try {
          const result = await jose.jwtVerify(token, secret, {
            algorithms: ["HS256"],
          });
          payload = result.payload;
        } catch (e) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { sub } = payload as { sub: string };
        const notesData = await prisma.note.findMany({
          where: {
            userId: parseInt(sub),
          },
        });

        const notes = notesData.map((note) => {
          const categories = note.category
            .split(",")
            .map((category) => atob(category));
          return { ...note, category: categories };
        });
        return Response.json(notes);
      },

      async POST(req) {
        const Authorization = req.headers.get("Authorization");
        if (!Authorization) {
          return new Response("Unauthorized", { status: 401 });
        }

        const token = Authorization.replace("Bearer ", "");

        let payload = null;

        try {
          const result = await jose.jwtVerify(token, secret, {
            algorithms: ["HS256"],
          });
          payload = result.payload;
        } catch (e) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { title, content, category } = (await req.json()) as {
          title: string;
          content: string;
          category: string[];
        };
        const { sub } = payload as { sub: string };

        const encodedCategories = category
          .map((category) => btoa(category))
          .join(",");

        const note = await prisma.note.create({
          data: {
            title,
            content,
            category: encodedCategories,
            isArchived: false,
            userId: parseInt(sub),
          },
        });

        return Response.json(note);
      },
    },

    "/api/notes/:id": {
      async PUT(req) {
        const Authorization = req.headers.get("Authorization");
        if (!Authorization) {
          return new Response("Unauthorized", { status: 401 });
        }

        const token = Authorization.replace("Bearer ", "");

        let payload = null;

        try {
          const result = await jose.jwtVerify(token, secret, {
            algorithms: ["HS256"],
          });
          payload = result.payload;
        } catch (e) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { sub } = payload as { sub: string };
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return new Response("Invalid note ID", { status: 400 });
        }

        // Check if note exists and belongs to user
        const existingNote = await prisma.note.findUnique({
          where: { id, userId: parseInt(sub) },
        });

        if (!existingNote) {
          return new Response("Note not found", { status: 404 });
        }

        const { title, content, category, isArchived } = (await req.json()) as {
          title?: string;
          content?: string;
          category?: string[];
          isArchived?: boolean;
        };

        const encodedCategories = category
          ? category.map((cat) => btoa(cat)).join(",")
          : undefined;

        const note = await prisma.note.update({
          where: { id },
          data: {
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(encodedCategories !== undefined && {
              category: encodedCategories,
            }),
            ...(isArchived !== undefined && { isArchived }),
          },
        });

        return Response.json(note);
      },

      async DELETE(req) {
        const Authorization = req.headers.get("Authorization");
        if (!Authorization) {
          return new Response("Unauthorized", { status: 401 });
        }

        const token = Authorization.replace("Bearer ", "");

        let payload = null;

        try {
          const result = await jose.jwtVerify(token, secret, {
            algorithms: ["HS256"],
          });
          payload = result.payload;
        } catch (e) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { sub } = payload as { sub: string };
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return new Response("Invalid note ID", { status: 400 });
        }

        await prisma.note.delete({
          where: { id, userId: parseInt(sub) },
        });

        return new Response(null, { status: 204 });
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
