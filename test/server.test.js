const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createServer } = require("../server");

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("health endpoint reports that the application is ready", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("students can be created, listed, and removed", async () => {
  const createdResponse = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Student",
      email: "test.student@example.com",
      course: "Software Engineering"
    })
  });
  assert.equal(createdResponse.status, 201);
  const createdStudent = await createdResponse.json();
  assert.equal(createdStudent.name, "Test Student");
  assert.ok(createdStudent.id);

  const listResponse = await fetch(`${baseUrl}/api/students`);
  const students = await listResponse.json();
  assert.ok(students.some((student) => student.id === createdStudent.id));

  const deleteResponse = await fetch(`${baseUrl}/api/students/${createdStudent.id}`, {
    method: "DELETE"
  });
  assert.equal(deleteResponse.status, 204);
});

test("creating a student without required fields returns a validation error", async () => {
  const response = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Incomplete Student" })
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Name, email, and course are required"
  });
});
