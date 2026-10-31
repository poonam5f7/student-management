const form = document.querySelector("#student-form");
const studentList = document.querySelector("#student-list");
const studentCount = document.querySelector("#student-count");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#message");

async function request(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

function renderStudents(students) {
  studentList.replaceChildren();
  for (const student of students) {
    const row = document.createElement("tr");
    for (const value of [student.name, student.email, student.course]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    const actions = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.className = "delete-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${student.name}`);
    removeButton.addEventListener("click", async () => {
      try {
        await request(`/api/students/${encodeURIComponent(student.id)}`, { method: "DELETE" });
        await loadStudents();
        message.textContent = `${student.name} was removed.`;
      } catch (error) {
        message.textContent = error.message;
      }
    });
    actions.append(removeButton);
    row.append(actions);
    studentList.append(row);
  }

  studentCount.textContent = `${students.length} ${students.length === 1 ? "student" : "students"}`;
  emptyState.hidden = students.length > 0;
}

async function loadStudents() {
  renderStudents(await request("/api/students"));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const student = Object.fromEntries(new FormData(form));
  try {
    await request("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
    form.reset();
    await loadStudents();
    message.textContent = `${student.name} was added.`;
  } catch (error) {
    message.textContent = error.message;
  }
});

loadStudents().catch((error) => {
  message.textContent = `Unable to load students: ${error.message}`;
});
