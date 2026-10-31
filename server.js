const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");
const students = [
  { id: randomUUID(), name: "Aarav Sharma", email: "aarav@example.com", course: "Computer Science" },
  { id: randomUUID(), name: "Maya Patel", email: "maya@example.com", course: "Information Technology" }
];
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

async function serveStatic(pathname, response) {
  const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "app.js", "styles.css"].includes(requestedFile)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const filePath = path.join(publicDirectory, requestedFile);
  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)],
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  } catch (error) {
    console.error(`Unable to serve ${requestedFile}:`, error);
    sendJson(response, 500, { error: "Unable to serve application" });
  }
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (pathname === "/api/students" && request.method === "GET") {
      sendJson(response, 200, students);
      return;
    }

    if (pathname === "/api/students" && request.method === "POST") {
      try {
        const student = await readJson(request);
        const name = typeof student.name === "string" ? student.name.trim() : "";
        const email = typeof student.email === "string" ? student.email.trim() : "";
        const course = typeof student.course === "string" ? student.course.trim() : "";

        if (!name || !email || !course) {
          sendJson(response, 400, { error: "Name, email, and course are required" });
          return;
        }

        const createdStudent = { id: randomUUID(), name, email, course };
        students.push(createdStudent);
        sendJson(response, 201, createdStudent);
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message });
      }
      return;
    }

    const studentId = pathname.match(/^\/api\/students\/([^/]+)$/)?.[1];
    if (studentId && request.method === "DELETE") {
      const studentIndex = students.findIndex((student) => student.id === studentId);
      if (studentIndex === -1) {
        sendJson(response, 404, { error: "Student not found" });
        return;
      }

      students.splice(studentIndex, 1);
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET") {
      await serveStatic(pathname, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Management app listening on port ${PORT}`);
  });
}

module.exports = { createServer };
