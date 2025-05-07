import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Review.css";
import Select from "react-select";
import { Filter } from "lucide-react";

function Review() {
  const [reviews, setReviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [scoreAwarded, setScoreAwarded] = useState({});
  const [optionChanged, setOptionChanged] = useState({});
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("number");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/admin-reviews").then((res) => {
      setReviews(res.data);
    });
  }, []);

  const handleFeedbackChange = (id, value) => {
    setFeedbacks((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleUpdate = async (id) => {
    const feedback = feedbacks[id];
    if (!feedback || feedback.trim() === "") {
      alert("Please enter feedback before submitting.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/update-review-status", {
        id,
        adminFeedback: feedback,
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      alert("Something went wrong while submitting feedback.");
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (filterBy === "number") {
      return r.register_number.toLowerCase().includes(term);
    } else if (filterBy === "course") {
      return r.course_name.toLowerCase().includes(term);
    }

    return true;
  });

  const groupedReviews = Object.values(
    filteredReviews.reduce((acc, r) => {
      const key = `${r.register_number}-${r.student_name}-${r.course_name}-${r.level}-${r.created_at}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {})
  );

  const filterOptions = [
    { value: "number", label: "Register Number" },
    { value: "course", label: "Course Name" },
  ];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "rgb(227, 238, 250)" : "#f9fafb",
      color: "#111827",
      cursor: "pointer",
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: "#d1d5db",
      boxShadow: "none",
      ":hover": {
        borderColor: "#1976d2",
      },
    }),
  };

  return (
    <div className="review-container">
      <div className="top-head">
        <h2 className="review-title">Pending Review Requests</h2>
        <div className="filter-toggle">
          <span
            onClick={() => setShowFilter(!showFilter)}
            style={{ fontSize: "22px", cursor: "pointer", marginTop: 2 }}
            className="filter-toggle-icon"
          >
            <Filter />
          </span>
          {showFilter && (
            <div className="course-filter">
              <div>
                <Select
                  value={filterOptions.find((opt) => opt.value === filterBy)}
                  onChange={(selected) => setFilterBy(selected.value)}
                  options={filterOptions}
                  styles={customStyles}
                />
              </div>
              <input
                type="text"
                placeholder={`Search by ${filterBy === "number" ? "Register Number" : "Course Name"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
        </div>
      </div>

      <table className="review-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Student</th>
            <th>Course</th>
            <th>Question</th>
            <th>Options</th>
            <th>Correct Option</th>
            <th>Feedback</th>
            <th>Actions</th>
            <th>Submit</th>
          </tr>
        </thead>
        <tbody>
          {groupedReviews.map((group, groupIndex) => {
            const rowSpan = group.length;

            return group.map((r, qIndex) => (
              <tr key={r.id}>
                {qIndex === 0 && (
                  <>
                    <td rowSpan={rowSpan}>{groupIndex + 1}</td>
                    <td rowSpan={rowSpan}>
                      {r.student_name}
                      <br />
                      {r.register_number}
                    </td>
                    <td rowSpan={rowSpan}>
                      {r.course_name}
                      <br />
                      (Lvl-{r.level})
                    </td>
                  </>
                )}

                <td>
                  <strong>Q-ID:</strong> {r.question_number}
                  <br />
                  <strong>{r.question}</strong>
                  <br />
                  <em>Comment : "{r.comment}"</em>
                </td>

                <td>
                  <ul className="review-options">
                    <li>{r.option1}</li>
                    <li>{r.option2}</li>
                    <li>{r.option3}</li>
                    <li>{r.option4}</li>
                  </ul>
                </td>

                <td style={{ textAlign: "center" }}>
                  <Select
                    defaultValue={{
                      value: r.correct_option,
                      label: `Option ${r.correct_option}`,
                    }}
                    options={[1, 2, 3, 4].map((num) => ({
                      value: num,
                      label: `Option ${num}`,
                    }))}
                    onChange={async (selected) => {
                      const newOption = selected.value;
                      try {
                        await axios.post(
                          "http://localhost:5000/update-correct-option",
                          {
                            courseId: r.course_id,
                            questionNumber: r.question_number,
                            newCorrectOption: newOption,
                          }
                        );
                        setOptionChanged((prev) => ({ ...prev, [r.id]: true }));
                        r.correct_option = newOption;
                      } catch (err) {
                        alert("Failed to update option.");
                      }
                    }}
                    styles={{
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isFocused ? "#cce5ff" : "white",
                        color: "black",
                      }),
                      control: (base) => ({
                        ...base,
                        minWidth: 120,
                      }),
                    }}
                  />
                  {optionChanged[r.id] && (
                    <div className="review-tag">✓ Changed</div>
                  )}
                </td>

                <td>
                  <textarea
                    className="review-textarea"
                    placeholder="Enter feedback"
                    rows={3}
                    value={feedbacks[r.id] || ""}
                    onChange={(e) => handleFeedbackChange(r.id, e.target.value)}
                  />
                </td>

                <td>
                  <button
                    className={`review-score-btn ${scoreAwarded[r.id] ? "frozen" : ""}`}
                    disabled={scoreAwarded[r.id]}
                    onClick={async () => {
                      try {
                        await axios.post(
                          "http://localhost:5000/increase-score",
                          {
                            Id: r.test_score_id,
                          }
                        );
                        setScoreAwarded((prev) => ({ ...prev, [r.id]: true }));
                      } catch (err) {
                        alert("Failed to increase score.");
                      }
                    }}
                  >
                    {scoreAwarded[r.id] ? "✓ Awarded" : "Add+1"}
                  </button>
                </td>

                <td>
                  <button
                    className="review-submit"
                    onClick={() => handleUpdate(r.id)}
                  >
                    Submit
                  </button>
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Review;
