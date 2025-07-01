const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create new test
router.post("/tests", async (req, res) => {
  const { title, created_by } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tests (title, created_by) VALUES ($1, $2) RETURNING *",
      [title, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Add question to a test
router.post("/questions", async (req, res) => {
  const { test_id, question_text, question_image, options, correct_option, positive_marks, negative_marks } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO questions
      (test_id, question_text, question_image, options, correct_option, positive_marks, negative_marks)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [test_id, question_text, question_image, options, correct_option, positive_marks, negative_marks]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Get full test with questions
// Get full test with sections and questions
router.get("/tests/:id", async (req, res) => {
  const testId = req.params.id;

  try {
    // Fetch test
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [testId]);
    if (testRes.rows.length === 0) return res.status(404).json({ message: "Test not found" });

    // Fetch sections
    const sectionRes = await pool.query("SELECT * FROM sections WHERE test_id = $1", [testId]);

    // Fetch questions for each section
    const sections = await Promise.all(
      sectionRes.rows.map(async (section) => {
        const questionsRes = await pool.query(
          "SELECT * FROM questions WHERE section_id = $1",
          [section.id]
        );
        return {
          ...section,
          questions: questionsRes.rows,
        };
      })
    );

    res.json({
      ...testRes.rows[0],
      sections, // ✅ includes questions inside each section
    });
  } catch (err) {
    console.error("❌ Error fetching full test:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Save full test with sections and questions
// Save full test with sections and questions
router.post("/save_test", async (req, res) => {
  const client = await pool.connect();
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const { title, sections } = req.body;

    await client.query("BEGIN");

    // 1. Insert into tests
    const testRes = await client.query(
      "INSERT INTO tests (title, created_by) VALUES ($1, $2) RETURNING id",
      [title, user.id]
    );
    const testId = testRes.rows[0].id;

    // 2. Insert each section
    for (const section of sections) {
      const sectionRes = await client.query(
        "INSERT INTO sections (title, test_id) VALUES ($1, $2) RETURNING id",
        [section.title, testId]
      );
      const sectionId = sectionRes.rows[0].id;

      // 3. Insert each question in that section
      for (const q of section.questions) {
        let safeOptions;

        try {
          if (Array.isArray(q.options)) {
            safeOptions = q.options;
          } else if (typeof q.options === "string") {
            const parsed = JSON.parse(q.options);
            if (!Array.isArray(parsed)) throw new Error("Parsed options is not array");
            safeOptions = parsed;
          } else {
            throw new Error("Invalid options format");
          }
        } catch (err) {
          console.warn("⚠️ Invalid options format. Defaulting to empty array:", q.options);
          safeOptions = [];
        }

        await client.query(
          `INSERT INTO questions
           (test_id, section_id, question_image, question_type, correct_option, options, positive_marks, negative_marks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            testId,
            sectionId,
            q.file_name || null,
            q.question_type || "MCQ",
            q.correct_option,
            JSON.stringify(safeOptions), // ✅ Ensures valid JSON array
            q.positive_marks,
            q.negative_marks,
          ]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Test saved successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error saving test:", err);
    res.status(500).json({ message: "Failed to save test" });
  } finally {
    client.release();
  }
});


// ✅ Fetch all available tests (for Dashboard)
router.get("/tests", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching tests:", err);
    res.status(500).json({ message: "Failed to fetch tests" });
  }
});

router.post("/submit", async (req, res) => {
  const { test_id, user_id, responses, timestamp } = req.body;

  try {
    await pool.query(
      "INSERT INTO submissions (test_id, user_id, responses, submitted_at) VALUES ($1, $2, $3, $4)",
      [test_id, user_id, JSON.stringify(responses), timestamp]
    );

    res.json({ message: "Submission received" });
  } catch (err) {
    console.error("❌ Submission error:", err);
    res.status(500).json({ message: "Failed to submit" });
  }
});



module.exports = router;