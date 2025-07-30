import React, { useEffect, useState } from "react";
import "./Progress.css";
import Select from "react-select";
import { Filter } from "lucide-react";

const Progress = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("number");

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/student-progress")
      .then((res) => res.json())
      .then(setCourses)
      .catch((err) => console.error("Failed to fetch student progress", err));
  }, []);

  const handleShowTable = (course) => {
    setSelectedCourse(course);
  };

  const handleCloseTable = () => {
    setSelectedCourse(null);
    setSearchTerm("");
  };

  const filterOptions = [
    { value: "number", label: "Register Number" },
    { value: "course", label: "Course Name" },
    { value: "level", label: "Level" },
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

  const filteredStudents =
    selectedCourse?.students.filter((student) => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;

      if (filterBy === "number") {
        return student.register_number.toLowerCase().includes(term);
      } else if (filterBy === "course") {
        return selectedCourse.course_name.toLowerCase().includes(term);
      } else if (filterBy === "level") {
        return selectedCourse.level.toString().toLowerCase().includes(term);
      } else if (filterBy === "department") {
        return student.department.toLowerCase().includes(term);
      } else if (filterBy === "year") {
        return student.year.toString().toLowerCase().includes(term);
      }

      return true;
    }) || [];

  return (
    <div className="progress-container">
      <h2 className="progress-title">Student Progress</h2>

      {!selectedCourse && (
        <div className="course-cards">
          {courses.map((course) => (
            <div
              key={course.course_id}
              className="course-card"
              style={{ height: "auto" }}
            >
              <div>
                <h3 className="course-title">
                  {course.course_name} (Level-{course.level})
                </h3>
                <p>
                  <strong>Total Registered:</strong>{" "}
                  {course.total_registered - course.total_slot_booked}
                </p>
                <p>
                  <strong>Total Slots Booked:</strong>{" "}
                  {course.total_slot_booked}
                </p>
              </div>
              <button
                className="toggle-btn"
                onClick={() => handleShowTable(course)}
              >
                Show Progress Table
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCourse && (
        <div className="progress-table-page">
          <div className="progress-table-page-top">
            <div>
              <h3 className="course-title">
                {selectedCourse.course_name} (Level-{selectedCourse.level})
              </h3>
              <p>
                <strong>Total Registered:</strong>{" "}
                {selectedCourse.total_registered -
                  selectedCourse.total_slot_booked}
              </p>
              <p className="course-total-reg">
                <strong>Total Slots Booked:</strong>{" "}
                {selectedCourse.total_slot_booked}
              </p>
            </div>
            <div className="progress-filter-closetable">
              <div className="filter-toggle">
                <span
                  onClick={() => setShowFilter(!showFilter)}
                  style={{
                    fontSize: "22px",
                    cursor: "pointer",
                    marginTop: 25,
                    marginRight: 15,
                  }}
                  className="progress-filter-toggle-icon"
                >
                  <Filter />
                </span>

                {showFilter && (
                  <div className="progresspage-course-filter">
                    <div>
                      <Select
                        value={filterOptions.find(
                          (opt) => opt.value === filterBy
                        )}
                        onChange={(selected) => setFilterBy(selected.value)}
                        options={filterOptions}
                        styles={customStyles}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder={`Search by ${
                        filterBy === "number"
                          ? "Register Number"
                          : filterBy === "course"
                          ? "Course Name"
                          : filterBy === "level"
                          ? "Level"
                          : filterBy === "department"
                          ? "Department"
                          : "Year"
                      }`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                )}

                <button className="close-btn" onClick={handleCloseTable}>
                  Close Table
                </button>
              </div>
            </div>
          </div>

          <table className="progress-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Email</th>
                <th>Reg. Number</th>
                <th>Department</th>
                <th>Year</th>
                <th>Attempts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <tr key={i}>
                  <td>
                    <img
                      src={student.image}
                      alt={student.name}
                      className="table-image"
                    />
                  </td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.register_number}</td>
                  <td>{student.department}</td>
                  <td>{student.year}</td>
                  <td>{student.attempts + 1}</td>
                  <td>
                    {student.slot_time ? (
                      <span className="status-booked">Slot Booked</span>
                    ) : (
                      <span className="status-registered">Registered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Progress;
