import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { Filter } from "lucide-react";
import "./Review.css";

// Shared FilterBar component
function FilterBar({
  showFilter,
  setShowFilter,
  filterBy,
  setFilterBy,
  searchTerm,
  setSearchTerm,
  filterOptions,
  customStyles,
  extraButton,
}) {
  return (
    <div className="filter-toggle">
      <span
        onClick={() => setShowFilter(!showFilter)}
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
            placeholder={`Search by ${
              filterOptions.find((opt) => opt.value === filterBy)?.label || ""
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}
      {extraButton}
    </div>
  );
}

// HistoryReviewPage component
function HistoryReviewPage({
  onClose,
  showFilter,
  setShowFilter,
  filterBy,
  setFilterBy,
  searchTerm,
  setSearchTerm,
  filterOptions,
  customStyles,
}) {
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/review-history")
      .then((res) => {
        setReviewHistory(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setReviewHistory([]);
        setLoading(false);
      });
  }, []);

  const filteredHistory = reviewHistory.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    switch (filterBy) {
      case "number":
        return item.register_number && item.register_number.toLowerCase().includes(term);
      case "student":
        return item.student_name && item.student_name.toLowerCase().includes(term);
      case "course":
        return item.course_name && item.course_name.toLowerCase().includes(term);
      case "level":
        return item.level && item.level.toString().toLowerCase().includes(term);
      case "question":
        return item.question_number && item.question_number.toString().toLowerCase().includes(term);
      case "status":
        return item.status && item.status.toLowerCase().includes(term);
      case "admin_feedback":
        return item.admin_feedback && item.admin_feedback.toLowerCase().includes(term);
      case "department":
        return item.department && item.department.toLowerCase().includes(term);
      case "year":
        return item.year && item.year.toString().toLowerCase().includes(term);
      default:
        return true;
    }
  });

  return (
    <div className="review-history-page">
      <div className="top-head">
        <h2 className="review-title">Review History</h2>
        <FilterBar
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={filterOptions}
          customStyles={customStyles}
          extraButton={
            <button
              className="review-history-btn"
              onClick={onClose}
            >
              Close Table
            </button>
          }
        />
      </div>
      <div>
        <table className="review-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Register Number</th>
              <th>Course</th>
              <th>Level</th>
              <th>Question No.</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Admin Feedback</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center" }}>
                  No review history found.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.student_name}</td>
                  <td>{item.register_number}</td>
                  <td>{item.course_name}</td>
                  <td>{item.level}</td>
                  <td>{item.question_number}</td>
                  <td>{item.comment}</td>
                  <td>{item.status}</td>
                  <td>{item.admin_feedback}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Review() {
  const [reviews, setReviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [scoreAwarded, setScoreAwarded] = useState({});
  const [optionChanged, setOptionChanged] = useState({});
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("number");
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistoryPage, setShowHistoryPage] = useState(false);

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

    switch (filterBy) {
      case "number":
        return r.register_number && r.register_number.toLowerCase().includes(term);
      case "student":
        return r.student_name && r.student_name.toLowerCase().includes(term);
      case "course":
        return r.course_name && r.course_name.toLowerCase().includes(term);
      case "level":
        return r.level && r.level.toString().toLowerCase().includes(term);
      case "question":
        return r.question_number && r.question_number.toString().toLowerCase().includes(term);
      case "status":
        return r.status && r.status.toLowerCase().includes(term);
      case "admin_feedback":
        return r.admin_feedback && r.admin_feedback.toLowerCase().includes(term);
      case "department":
        return r.department && r.department.toLowerCase().includes(term);
      case "year":
        return r.year && r.year.toString().toLowerCase().includes(term);
      default:
        return true;
    }
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
    { value: "student", label: "Student Name" },
    { value: "course", label: "Course Name" },
    { value: "level", label: "Level" },
    { value: "question", label: "Question No." },
    { value: "status", label: "Status" },
    { value: "admin_feedback", label: "Admin Feedback" },
    { value: "department", label: "Department" },
    { value: "year", label: "Year" },
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

  if (showHistoryPage) {
    return (
      <HistoryReviewPage
        onClose={() => setShowHistoryPage(false)}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterOptions={filterOptions}
        customStyles={customStyles}
      />
    );
  }



  
  return (
    <div className="review-container">
      <div className="top-head">
        <h2 className="review-title">Pending Review Requests</h2>
        <FilterBar
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={filterOptions}
          customStyles={customStyles}
          extraButton={
            <button
              className="review-history-btn"
              onClick={() => setShowHistoryPage(true)}
            >
              Show Review History
            </button>
          }
        />
      </div>

      <table className="review-table">
        <thead>
          <tr>
            <th>S.No</th>
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