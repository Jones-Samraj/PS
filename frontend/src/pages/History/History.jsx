import React, { useEffect, useState } from "react";
import "./History.css";
import Select from "react-select";
import { Filter } from "lucide-react";

const History = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [courseSummary, setCourseSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("number");

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/test-history")
      .then((res) => res.json())
      .then((data) => {
        setTestHistory(data.history || []);
        setCourseSummary(data.summary || []);
      })
      .catch((err) => console.error("Failed to fetch test history", err));
  }, []);

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

  const filteredHistory = testHistory.filter((record) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    if (filterBy === "number") {
      return record.register_number.toLowerCase().includes(term);
    } else if (filterBy === "course") {
      return record.course_name.toLowerCase().includes(term);
    }

    return true;
  });

  return (
    <div className="history-table-container">
      <div className="historyname-filter">
        <h2 className="history-title">History</h2>

        <div className="history-filter-toggle">
          <span
            onClick={() => setShowFilter(!showFilter)}
            style={{
              fontSize: "22px",
              cursor: "pointer",
              marginTop: 1,
              marginRight: 15,
            }}
            className="history-filter-toggle-icon"
          >
            <Filter />
          </span>

          {showFilter && (
            <div className="historypage-course-filter">
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

      <div className="course-summary">
        <ul>
          {courseSummary.map((course, i) => (
            <li key={i}>
              {course.course_name + " (Level-" + course.level + ")"} :{" "}
              {course.completed_count}
            </li>
          ))}
        </ul>
      </div>

      <table className="history-progress-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Image</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Year</th>
            <th>Course</th>
            <th>Status</th>
            <th>Score</th>
            <th>Attempt</th>
            <th>Test Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.map((record, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <img
                  src={record.image}
                  alt={record.name}
                  className="table-image"
                />
              </td>
              <td>{record.name}<br />{record.register_number}</td>
              <td>{record.email}</td>
              <td>{record.department}</td>
              <td>{record.year}</td>
              <td>{record.course_name + " (Lvl-" + record.level + ")"}</td>
              <td>
                {record.score >= 1 ? (
                  <span className="status-completed">Completed</span>
                ) : (
                  <span className="status-registered">Incomplete</span>
                )}
              </td>
              <td>{record.score}</td>
              <td>{record.attempt}</td>
              <td>{new Date(record.test_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
