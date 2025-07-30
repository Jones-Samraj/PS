import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Filter } from "lucide-react";
import "./History.css";

const History = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [courseSummary, setCourseSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("number");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [showSummary, setShowSummary] = useState(true);
  const [summaryLevel, setSummaryLevel] = useState("All");
  const [summaryCourse, setSummaryCourse] = useState("All");

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

  const levelOptions = [
    { value: "All", label: "All Levels" },
    { value: "1", label: "Level 1" },
    { value: "2", label: "Level 2" },
    { value: "3", label: "Level 3" },
    { value: "4", label: "Level 4" },
  ];

  const yearOptions = [
    { value: "All", label: "All Years" },
    { value: "1", label: "Year 1" },
    { value: "2", label: "Year 2" },
    { value: "3", label: "Year 3" },
    { value: "4", label: "Year 4" },
  ];

  const departmentOptions = [
    { value: "All", label: "All Departments" },
    { value: "CSE", label: "CSE" },
    { value: "IT", label: "IT" },
    { value: "EEE", label: "EEE" },
    { value: "MECH", label: "MECH" },
  ];

  const courseNameOptions = [
    { value: "All", label: "All Courses" },
    ...Array.from(new Set(courseSummary.map((c) => c.course_name))).map(
      (name) => ({
        value: name,
        label: name,
      })
    ),
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
    if (term) {
      if (filterBy === "number") {
        if (!record.register_number.toLowerCase().includes(term)) return false;
      } else if (filterBy === "course") {
        if (!record.course_name.toLowerCase().includes(term)) return false;
      }
    }

    if (selectedLevel !== "All" && record.level.toString() !== selectedLevel) {
      return false;
    }

    if (selectedYear !== "All" && record.year.toString() !== selectedYear) {
      return false;
    }

    if (
      selectedDepartment !== "All" &&
      record.department.toLowerCase() !== selectedDepartment.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="history-table-container">
      <div className="historyname-filter">
        <h2 className="history-title">History</h2>

        <div className={`history-filter-toggle ${!showFilter ? "collapsed" : ""} ${showSummary ? "summary" : ""}`}>
          <span
            onClick={() => setShowFilter(!showFilter)}
            style={{
              fontSize: "22px",
              cursor: "pointer",
            }}
            className="history-filter-toggle-icon"
          >
            <Filter />
          </span>
          {showFilter && (
            <div className="historypage-course-filter">
              {showSummary ? (
                <>
                  <Select
                    value={courseNameOptions.find((opt) => opt.value === summaryCourse)}
                    onChange={(selected) => setSummaryCourse(selected.value)}
                    options={courseNameOptions}
                    styles={customStyles}
                    placeholder="Filter by Course"
                  />
                  <Select
                    value={levelOptions.find((opt) => opt.value === summaryLevel)}
                    onChange={(selected) => setSummaryLevel(selected.value)}
                    options={levelOptions}
                    styles={customStyles}
                    placeholder="Filter by Level"
                  />
                </>
              ) : (
                <>
                  <Select
                    value={filterOptions.find((opt) => opt.value === filterBy)}
                    onChange={(selected) => setFilterBy(selected.value)}
                    options={filterOptions}
                    styles={customStyles}
                  />
                  <input
                    type="text"
                    placeholder={`Search by ${filterBy === "number" ? "Register Number" : "Course Name"}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <Select
                    value={levelOptions.find((opt) => opt.value === selectedLevel)}
                    onChange={(selected) => setSelectedLevel(selected.value)}
                    options={levelOptions}
                    styles={customStyles}
                    placeholder="Filter by Level"
                  />
                  <Select
                    value={yearOptions.find((opt) => opt.value === selectedYear)}
                    onChange={(selected) => setSelectedYear(selected.value)}
                    options={yearOptions}
                    styles={customStyles}
                    placeholder="Filter by Year"
                  />
                  <Select
                    value={departmentOptions.find((opt) => opt.value === selectedDepartment)}
                    onChange={(selected) => setSelectedDepartment(selected.value)}
                    options={departmentOptions}
                    styles={customStyles}
                    placeholder="Filter by Department"
                  />
                </>
              )}
            </div>
          )}
        </div>
        
        <button
          className="toggle-summary-btn"
          onClick={() => setShowSummary(!showSummary)}
        >
          {showSummary ? "Show Test History" : "Show Course Summary"}
        </button>
      </div>

      {showSummary ? (
        <div className="course-summary">
          <table className="course-summary-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Level</th>
                <th>Completed Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                courseSummary
                  .filter(
                    (course) =>
                      (summaryCourse === "All" || course.course_name === summaryCourse) &&
                      (summaryLevel === "All" || course.level.toString() === summaryLevel)
                  )
                  .reduce((acc, course) => {
                    if (!acc[course.course_name]) acc[course.course_name] = [];
                    acc[course.course_name].push(course);
                    return acc;
                  }, {})
              ).map(([courseName, levels]) =>
                levels.map((course, index) => (
                  <tr
                    key={`${courseName}-${index}`}
                    className={hoveredCourse === courseName ? "hovered-row" : ""}
                    onMouseEnter={() => setHoveredCourse(courseName)}
                    onMouseLeave={() => setHoveredCourse(null)}
                  >
                    {index === 0 && (
                      <td rowSpan={levels.length} style={{ fontWeight: "600" }}>
                        {courseName}
                      </td>
                    )}
                    <td>Level {course.level}</td>
                    <td>{course.completed_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="history-progress">
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
                  <img src={record.image} alt={record.name} className="table-image" />
                </td>
                <td>
                  {record.name}
                  <br />
                  {record.register_number}
                </td>
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
      )}
    </div>
  );
};

export default History;
