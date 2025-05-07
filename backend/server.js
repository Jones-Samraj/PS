const express = require("express"); // Importing to Handle GET, POST, PUT, DELETE requests
const mysql = require("mysql2"); // Importing for MySQL database connection
const bcrypt = require("bcryptjs"); // Importing for password hashing
const jwt = require("jsonwebtoken"); // Importing for securely transmit user data between frontend and backend after login
const cors = require("cors"); // Importing CORS for cross-origin resource sharing (Frontend	Runs on http://localhost:5173 and Backend Runs on http://localhost:5000)
require("dotenv").config(); // Importing environment variables from .env file
const app = express(); 
app.use(express.json()); //express.json() middleware automatically converts that raw JSON into a JavaScript object inside req.body
app.use(cors()); 

const PORT = process.env.PORT;
const SECRET_KEY = process.env.JWT_SECRET;
const db = mysql.createPool({ //Creates a pool of multiple connections to the database
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, //maximum number of connections to create at once
  queueLimit: 0, //how many requests can wait for a free connection
});

// Middleware: Verify JWT Token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });

    req.user = user;
    next();
  });
}

// Protected Route (Admin)
app.get("/admin", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  res.json({ message: "Welcome Admin!" });
});

// Protected Route (Student)
app.get("/student", authenticateToken, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied" });
  }
  res.json({ message: "Welcome Student!" });
});

// Fetch User Role from Token
app.get("/user-role", authenticateToken, (req, res) => {
  res.json({ role: req.user.role });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql =
    "SELECT * FROM authentication WHERE email = ? AND auth_provider = 'local'"; // local login

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "2h", // Token expiration time
    });

    res.json({
      token,
      id: user.id,
      role: user.role,
      message: "Login successful",
    });
  });
});
app.post("/oauth", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  db.query(
    "SELECT * FROM authentication WHERE email = ? AND auth_provider = 'google'", // Google login
    [email],
    (err, results) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        const user = results[0];
        res.status(200).json({
          message: "Login successful",
          id: user.id,
          role: user.role,
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    }
  );
});

// Add Courses
app.get("/courses", (req, res) => {
  const sql = `
    SELECT c.id AS course_id, c.name, c.level, c.thumbnail, c.material, c.years, c.department,
           m.id AS mcq_id, m.question, m.option1, m.option2, m.option3, m.option4, m.correct_option 
    FROM courses c 
    LEFT JOIN mcqs m ON c.id = m.course_id
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);

    const courses = {};
    result.forEach((row) => {
      if (!courses[row.course_id]) {
        courses[row.course_id] = {
          id: row.course_id,
          name: row.name,
          level: row.level,
          thumbnail: row.thumbnail,
          material: row.material,
          years: row.years ? row.years.split(",") : [],
          department: row.department ? row.department.split(",") : [],
          mcqs: [],
        };
      }
      if (row.mcq_id) {
        courses[row.course_id].mcqs.push({
          id: row.mcq_id,
          question: row.question,
          option1: row.option1,
          option2: row.option2,
          option3: row.option3,
          option4: row.option4,
          correct_option: row.correct_option,
        });
      }
    });

    res.json(Object.values(courses));
  });
});
app.delete("/delete-mcq/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM mcqs WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "MCQ not found!" });
    }

    res.json({ message: "MCQ deleted successfully!" });
  });
});
app.put("/update-course/:id", (req, res) => {
  const { id } = req.params;
  const { name, level, thumbnail, material, mcqs, years, department } =
    req.body;
  const yearStr = Array.isArray(years) ? years.join(",") : "";
  const departmentStr = Array.isArray(department) ? department.join(",") : "";

  const sql =
    "UPDATE courses SET name = ?, level = ?, thumbnail = ?, material = ?, years = ?, department = ? WHERE id = ?";
  db.query(
    sql,
    [name, level, thumbnail, material, yearStr, departmentStr, id],
    (err) => {
      if (err) {
        console.error("Error updating course:", err);
        return res
          .status(500)
          .json({ error: "Failed to update course", details: err });
      }

      const mcqPromises = mcqs.map((mcq) => {
        return new Promise((resolve, reject) => {
          if (mcq.id) {
            const updateSQL =
              "UPDATE mcqs SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ? WHERE id = ?";
            db.query(
              updateSQL,
              [
                mcq.question,
                mcq.option1,
                mcq.option2,
                mcq.option3,
                mcq.option4,
                mcq.correct_option,
                mcq.id,
              ],
              (err) => {
                if (err) {
                  console.error("Error updating MCQ:", err);
                  return reject({
                    error: "Failed to update MCQ",
                    details: err,
                  });
                }
                resolve();
              }
            );
          } else {
            const insertSQL =
              "INSERT INTO mcqs (course_id, question, option1, option2, option3, option4, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)";
            db.query(
              insertSQL,
              [
                id,
                mcq.question,
                mcq.option1,
                mcq.option2,
                mcq.option3,
                mcq.option4,
                mcq.correct_option,
              ],
              (err) => {
                if (err) {
                  console.error("Error inserting MCQ:", err);
                  return reject({
                    error: "Failed to insert MCQ",
                    details: err,
                  });
                }
                resolve();
              }
            );
          }
        });
      });

      Promise.all(mcqPromises)
        .then(() => {
          res.json({ message: "Course and MCQs updated successfully!" });
        })
        .catch((err) => {
          res.status(500).json(err);
        });
    }
  );
});
app.post("/add-course", (req, res) => {
  const { name, level, thumbnail, material, years, department, mcqs } =
    req.body;

  const sql =
    "INSERT INTO courses (name, level, thumbnail, material, years, department) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [name, level, thumbnail, material, years.join(","), department.join(",")],
    (err, result) => {
      if (err) {
        console.error("Error inserting course:", err);
        return res
          .status(500)
          .json({ error: "Failed to insert course", details: err });
      }

      const courseId = result.insertId;

      const mcqValues = mcqs.map((mcq) => [
        courseId,
        mcq.question,
        mcq.option1,
        mcq.option2,
        mcq.option3,
        mcq.option4,
        mcq.correct_option,
      ]);

      if (mcqValues.length > 0) {
        const mcqSql =
          "INSERT INTO mcqs (course_id, question, option1, option2, option3, option4, correct_option) VALUES ?";
        db.query(mcqSql, [mcqValues], (err) => {
          if (err) {
            console.error("Error inserting MCQs:", err);
            return res
              .status(500)
              .json({ error: "Failed to insert MCQs", details: err });
          }
          res.json({ message: "Course and MCQs added successfully!" });
        });
      } else {
        res.json({ message: "Course added successfully, no MCQs provided." });
      }
    }
  );
});
app.delete("/delete-course/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM mcqs WHERE course_id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);

    db.query("DELETE FROM courses WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Course and its MCQs deleted successfully!" });
    });
  });
});
const bulkUploadRoute = require("./bulkUpload")(db);
app.use("/api", bulkUploadRoute);
const generateAIRoutes = require("./generate-ai-mcqs");
app.use("/", generateAIRoutes);

// Review
app.get("/admin-reviews", (req, res) => {
  const sql = `
    SELECT ts.id AS test_score_id, qr.id, qr.user_id, a.register_number,
           a.name AS student_name, qr.course_id, c.name AS course_name, c.level,
           qr.question_number, qr.comment, qr.status, qr.admin_feedback, qr.created_at,
           m.question, m.option1, m.option2, m.option3, m.option4, m.correct_option
    FROM question_reviews qr
    JOIN (
      SELECT MAX(id) AS id, user_id, course_id
      FROM test_scores
      GROUP BY user_id, course_id
    ) latest_ts ON latest_ts.user_id = qr.user_id AND latest_ts.course_id = qr.course_id
    JOIN test_scores ts ON ts.id = latest_ts.id
    JOIN authentication a ON qr.user_id = a.id
    JOIN courses c ON qr.course_id = c.id
    LEFT JOIN mcqs m ON qr.course_id = m.course_id AND qr.question_number = m.id
    WHERE qr.status = 'Pending'
    ORDER BY qr.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching admin reviews:", err);
      return res.status(500).json({ error: "Failed to fetch admin reviews" });
    }
    res.json(results);
  });
});
app.post("/update-review-status", (req, res) => {
  const { id, adminFeedback } = req.body;

  db.query(
    "UPDATE question_reviews SET status = 'Reviewed', admin_feedback = ? WHERE id = ?",
    [adminFeedback, id],
    (err, result) => {
      if (err) {
        console.error("Error updating review:", err);
        return res.status(500).json({ error: "Could not update review." });
      }

      res.json({ message: "Review updated." });
    }
  );
});
app.post("/update-correct-option", (req, res) => {
  const { courseId, questionNumber, newCorrectOption } = req.body;

  const sql = `
    UPDATE mcqs
    SET correct_option = ?
    WHERE course_id = ? AND id = ?
  `;

  db.query(sql, [newCorrectOption, courseId, questionNumber], (err, result) => {
    if (err) {
      console.error("Error updating correct option:", err);
      return res.status(500).json({ error: "Could not update option." });
    }
    res.json({ message: "Correct option updated." });
  });
});
app.post("/increase-score", (req, res) => {
  const { Id } = req.body;

  const sql = `
    UPDATE test_scores
    SET score = score + 1
    WHERE id = ?
  `;

  db.query(sql, [Id], (err, result) => {
    if (err) {
      console.error("Error updating score:", err);
      return res.status(500).json({ error: "Could not update score." });
    }
    res.json({ message: "Score updated." });
  });
});

// Progress
app.get("/api/admin/student-progress", (req, res) => {
  const query = `
    (
      SELECT 
        c.level,
        c.id AS course_id,
        c.name AS course_name,
        a.id AS user_id,
        a.name,
        a.email,
        a.register_number,
        a.department,
        a.image,
        a.year,
        reg.slot_time,
        ts.score,
        (
          SELECT COUNT(*) 
          FROM booked_courses r 
          WHERE r.course_id = c.id
        ) AS total_registered,
        (
          SELECT COUNT(*) 
          FROM booked_courses b 
          WHERE b.course_id = c.id AND b.slot_time IS NOT NULL
        ) AS total_slot_booked,
        (
          SELECT COUNT(DISTINCT t.user_id)
          FROM test_scores t
          WHERE t.course_id = c.id AND t.score >= 1
        ) AS total_completed,
        (
          SELECT COUNT(*) 
          FROM test_scores t 
          WHERE t.user_id = a.id AND t.course_id = c.id
        ) AS attempts
      FROM booked_courses reg
      LEFT JOIN authentication a ON a.id = reg.user_id AND a.role = 'student'
      LEFT JOIN courses c ON c.id = reg.course_id
      LEFT JOIN test_scores ts ON ts.user_id = a.id AND ts.course_id = c.id 
    )
    ORDER BY course_id, user_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Failed to fetch student progress:", err);
      return res.status(500).send({ error: "Server error" });
    }

    const grouped = {};

    for (const row of results) {
      const courseId = row.course_id;
      if (!grouped[courseId]) {
        grouped[courseId] = {
          course_id: courseId,
          course_name: row.course_name,
          level: row.level,
          total_registered: row.total_registered || 0,
          total_slot_booked: row.total_slot_booked || 0,
          total_completed: row.total_completed || 0,
          students: [],
        };
      }

      if (
        row.user_id &&
        !grouped[courseId].students.some((s) => s.user_id === row.user_id)
      ) {
        grouped[courseId].students.push({
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          register_number: row.register_number,
          department: row.department,
          year: row.year,
          image: row.image,
          score: row.score ?? "N/A",
          attempts: row.attempts ?? 0,
          slot_time: row.slot_time,
          completed: row.score !== null && parseFloat(row.score) >= 1,
        });
      }
    }

    res.json(Object.values(grouped));
  });
});

//History
app.get("/api/admin/test-history", (req, res) => {
  const historyQuery = `
    SELECT 
      c.level,
      ts.score,
      ts.test_date,
      ts.course_id,
      a.id AS user_id,
      a.name,
      a.email,
      a.register_number,
      a.department,
      a.year,
      a.image,
      c.name AS course_name,
      (
        SELECT COUNT(*) 
        FROM test_scores t 
        WHERE t.user_id = ts.user_id AND t.course_id = ts.course_id AND t.test_date <= ts.test_date
      ) AS attempt
    FROM test_scores ts
    LEFT JOIN authentication a ON a.id = ts.user_id AND a.role = 'student'
    LEFT JOIN courses c ON c.id = ts.course_id
    ORDER BY ts.test_date DESC;
  `;

  const summaryQuery = `
    SELECT 
      c.level,
      c.name AS course_name,
      COUNT(DISTINCT ts.user_id) AS completed_count
    FROM test_scores ts
    INNER JOIN courses c ON c.id = ts.course_id
    WHERE ts.score >= 1
    GROUP BY ts.course_id
    ORDER BY completed_count DESC;
  `;

  db.query(historyQuery, (err1, historyResults) => {
    if (err1) {
      console.error("Failed to fetch test history:", err1);
      return res.status(500).send({ error: "Server error" });
    }

    db.query(summaryQuery, (err2, summaryResults) => {
      if (err2) {
        console.error("Failed to fetch course summary:", err2);
        return res.status(500).send({ error: "Server error" });
      }

      res.json({ history: historyResults, summary: summaryResults });
    });
  });
});

//Dashboard
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT * FROM authentication WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json(results[0]);
      }
    }
  );
});
app.get("/user-bookings/:userId", (req, res) => {
  const { userId } = req.params;
  db.query(
    `SELECT bc.id, bc.course_id, c.name AS course_name, c.level, c.thumbnail AS thumb_nail, bc.venue, bc.slot_time, c.material AS material, c.level
     FROM booked_courses bc
     JOIN courses c ON bc.course_id = c.id
     WHERE bc.user_id = ? AND bc.slot_time IS NOT NULL`,
    [userId],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(result);
      }
    }
  );
});
app.post("/store-score", (req, res) => {
  const { userId, courseId, score } = req.body;
  const sql = `INSERT INTO test_scores (user_id, course_id, score) VALUES (?, ?, ?)`;

  db.query(sql, [userId, courseId, score], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Score saved successfully" });
  });
});
app.delete("/delete-booking/:bookingId", (req, res) => {
  const bookingId = req.params.bookingId;
  const sql = `DELETE FROM booked_courses WHERE id = ?`;

  db.query(sql, [bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Booking deleted after test" });
  });
});
app.get("/api/users/:id/completed-courses", (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT c.id, c.name, c.level, c.thumbnail, t.score, t.test_date,
      (SELECT COUNT(*) 
        FROM test_scores ts 
        WHERE ts.user_id = t.user_id AND ts.course_id = c.id) AS attempts
    FROM test_scores t
    JOIN courses c ON t.course_id = c.id
    WHERE t.user_id = ? AND t.score >= 1
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching completed courses:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
});
app.get("/api/users/:id/graph-courses", (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT c.name, MAX(c.level) AS level
    FROM test_scores t
    JOIN courses c ON t.course_id = c.id
    WHERE t.user_id = ? AND t.score >= 1
    GROUP BY c.name
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching graph courses:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
});

// Courses
app.get("/courses/:userId", (req, res) => {
  const userId = req.params.userId;

  const getUserQuery =
    "SELECT year, department FROM authentication WHERE id = ?";
  db.query(getUserQuery, [userId], (err, userResult) => {
    if (err)
      return res.status(500).json({ message: "Error fetching user info" });
    if (userResult.length === 0)
      return res.status(404).json({ message: "User not found" });

    const studentYear = userResult[0].year;
    const studentDept = userResult[0].department;

    const sql = `
      SELECT c.id AS course_id, c.name, c.level, c.thumbnail, c.material, c.years, c.department,
             m.id AS mcq_id, m.question, m.option1, m.option2, m.option3, m.option4, m.correct_option 
      FROM courses c 
      LEFT JOIN mcqs m ON c.id = m.course_id
    `;

    db.query(sql, [studentDept], (err, result) => {
      if (err) return res.status(500).json(err);

      const courses = {};
      result.forEach((row) => {
        const coursedepartment = row.department
          ? row.department.split(",")
          : [];
        if (!coursedepartment.includes(studentDept)) return;
        const courseYears = row.years ? row.years.split(",").map(Number) : [];

        if (!courseYears.includes(studentYear)) return;

        if (!courses[row.course_id]) {
          courses[row.course_id] = {
            id: row.course_id,
            name: row.name,
            level: row.level,
            thumbnail: row.thumbnail,
            material: row.material,
            years: courseYears,
            department: coursedepartment,
            mcqs: [],
          };
        }

        if (row.mcq_id) {
          courses[row.course_id].mcqs.push({
            id: row.mcq_id,
            question: row.question,
            option1: row.option1,
            option2: row.option2,
            option3: row.option3,
            option4: row.option4,
            correct_option: row.correct_option,
          });
        }
      });

      res.json(Object.values(courses));
    });
  });
});
app.get("/course-completion/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;

  const sql = `SELECT score FROM test_scores WHERE user_id = ? AND course_id = ? AND score >= 1`;

  db.query(sql, [userId, courseId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (result.length > 0 && result[0].score >= 1) {
      return res.json({ completed: true });
    } else {
      return res.json({ completed: false });
    }
  });
});
app.post("/register-course", (req, res) => {
  const { user_id, course_id } = req.body;

  db.query(
    "SELECT * FROM booked_courses WHERE user_id = ? AND course_id = ?",
    [user_id, course_id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .send({ message: "Server error. Try again later." });
      }

      if (result.length > 0) {
        return res
          .status(400)
          .send({ message: "You are already registered for this course!" });
      }

      db.query(
        "INSERT INTO booked_courses (user_id, course_id, venue, slot_time) VALUES (?, ?, NULL, NULL)",
        [user_id, course_id],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send({ message: "Server error. Try again later." });
          }
          res.send({ message: "Course registered successfully!" });
        }
      );
    }
  );
});

// SlotBooking
app.get("/registered-courses/:userId", (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      bc.course_id, 
      c.name AS course_name, 
      c.thumbnail AS thumb_nail, 
      c.material, 
      bc.slot_time, 
      bc.venue, 
      c.level,
      (
        SELECT COUNT(*) 
        FROM test_scores t 
        WHERE t.user_id = bc.user_id AND t.course_id = bc.course_id
      ) AS attempts
    FROM booked_courses bc
    JOIN courses c ON bc.course_id = c.id
    WHERE bc.user_id = ? AND bc.slot_time IS NULL
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching booked courses:", err);
      return res.status(500).send("Server error");
    }
    res.send(result);
  });
});
app.post("/book-course", (req, res) => {
  const { user_id, course_id, venue, slot_time } = req.body;
  db.query(
    "DELETE FROM booked_courses WHERE user_id = ? AND course_id = ? AND slot_time IS NULL",
    [user_id, course_id],
    (deleteErr, deleteResult) => {
      if (deleteErr) {
        return res.status(500).send({
          error: "Database DELETE error",
          details: deleteErr.sqlMessage,
        });
      }

      db.query(
        "INSERT INTO booked_courses (user_id, course_id, venue, slot_time) VALUES (?, ?, ?, ?)",
        [user_id, course_id, venue, slot_time],
        (insertErr, insertResult) => {
          if (insertErr) {
            return res.status(500).send({
              error: "Database INSERT error",
              details: insertErr.sqlMessage,
            });
          }
          res.send({ message: "Slot booked successfully!" });
        }
      );
    }
  );
});

// Codereview
app.get("/student-reviews/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);
  const sql = `
    SELECT c.level, qr.id, qr.user_id, qr.course_id, c.name AS course_name,
           qr.question_number, qr.comment, qr.status, qr.admin_feedback, qr.created_at
    FROM question_reviews qr
    JOIN courses c ON qr.course_id = c.id
    WHERE qr.user_id = ?
    ORDER BY qr.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Testportal
app.get("/student-info/:id", (req, res) => {
  const userId = req.params.id;

  const query = "SELECT name FROM authentication WHERE id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching student info:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result[0]);
  });
});
app.get("/get-mcqs/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  const sql = `SELECT * FROM mcqs WHERE course_id = ? ORDER BY RAND() LIMIT 20`;

  db.query(sql, [courseId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post("/submit-review", (req, res) => {
  const { userId, courseId, question_number, comment } = req.body;

  if (!userId || !courseId || !question_number || !comment) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.query(
    "INSERT INTO question_reviews (user_id, course_id, question_number, comment, status) VALUES (?, ?, ?, ?, 'Pending')",
    [userId, courseId, question_number, comment],
    (err, result) => {
      if (err) {
        console.error("Error submitting review:", err);
        return res.status(500).json({ message: "Server error" });
      }

      res.json({ message: "Review submitted", insertId: result.insertId });
    }
  );
});

// PS
app.put("/update-mcq/:id", (req, res) => {
  const { id } = req.params;
  const { question, option1, option2, option3, option4, correct_option } =
    req.body;

  const sql = `
    UPDATE mcqs 
    SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ? 
    WHERE id = ?`;

  db.query(
    sql,
    [question, option1, option2, option3, option4, correct_option, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "MCQ updated successfully!" });
    }
  );
});

app.get("/slot-time/:userId", (req, res) => {
  const userId = req.params.userId;
  const query = "SELECT slot_time FROM booked_courses WHERE user_id = ?";

  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error });
    }
    if (results.length > 0) {
      res.json({ slot_time: results[0].slot_time });
    } else {
      res.status(404).json({ message: "No slot found for this user." });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});