import React, { useState, useEffect } from "react";
import axios from "axios";
import "../addcourses/addcourses.css";
import { Filter } from "lucide-react";
import Select from "react-select";

function Addcourses() {
  const [showForm, setShowForm] = useState(false);
  const [course, setCourse] = useState({
    name: "",
    level: "",
    thumbnail: "",
    material: "",
    years: [],
    department: [],
  });
  const [mcqs, setMcqs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const [showFilter, setShowFilter] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const response = await axios.get("http://localhost:5000/courses");
    setCourses(response.data);
  };

  const filterOptions = [
    { value: "name", label: "Course Name" },
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

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    switch (filterBy) {
      case "name":
        return c.name?.toLowerCase().includes(term);
      case "level":
        return c.level?.toLowerCase().includes(term);
      case "department":
        return c.department?.join(",").toLowerCase().includes(term);
      case "year":
        return c.years?.join(",").toLowerCase().includes(term);
      default:
        return true;
    }
  });

  const handleAddMCQ = () => {
    setMcqs([
      ...mcqs,
      {
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: "1",
      },
    ]);
  };

  const handleMCQChange = (index, field, value) => {
    const updatedMCQs = [...mcqs];
    updatedMCQs[index][field] = value;
    setMcqs(updatedMCQs);
  };

  const handleDeleteMCQ = async (mcqId, index) => {
    if (!mcqId) {
      setMcqs(mcqs.filter((_, i) => i !== index));
      return;
    }

    if (window.confirm("Are you sure you want to delete this MCQ?")) {
      try {
        await axios.delete(`http://localhost:5000/delete-mcq/${mcqId}`);
        setMcqs(mcqs.filter((_, i) => i !== index));
        alert("MCQ deleted successfully!");
      } catch (error) {
        console.error("Error deleting MCQ:", error);
        alert("Failed to delete MCQ.");
      }
    }
  };

  const handleYearChange = (selectedYear) => {
    setCourse((prev) => {
      const years = [...prev.years];
      if (years.includes(selectedYear)) {
        return { ...prev, years: years.filter((y) => y !== selectedYear) };
      } else {
        return { ...prev, years: [...years, selectedYear] };
      }
    });
  };

  const handleDepartmentChange = (selectedDept) => {
    setCourse((prev) => {
      const department = [...prev.department];
      if (department.includes(selectedDept)) {
        return {
          ...prev,
          department: department.filter((d) => d !== selectedDept),
        };
      } else {
        return {
          ...prev,
          department: [...department, selectedDept],
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (
      !course.name.trim() ||
      !course.level.trim() ||
      !course.thumbnail.trim() ||
      !course.material.trim() ||
      course.years.length === 0 ||
      course.department.length === 0
    ) {
      alert("Please fill all fields, including year and department!");
      return;
    }

    const filteredMCQs = mcqs.filter(
      (mcq) =>
        mcq.question.trim() !== "" ||
        mcq.option1.trim() !== "" ||
        mcq.option2.trim() !== "" ||
        mcq.option3.trim() !== "" ||
        mcq.option4.trim() !== ""
    );

    const courseData = { ...course, mcqs: filteredMCQs };

    try {
      if (editingCourse) {
        await axios.put(
          `http://localhost:5000/update-course/${editingCourse.id}`,
          courseData
        );
        alert("Course Updated!");
      } else {
        await axios.post("http://localhost:5000/add-course", courseData);
        alert("Course Added!");
      }

      setCourse({
        name: "",
        level: "",
        thumbnail: "",
        material: "",
        years: [],
        department: [],
      });
      setMcqs([]);
      setEditingCourse(null);
      fetchCourses();
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting course:", error);
      alert("Failed to submit course.");
    }
  };

  const handleClose = () => {
    setCourse({
      name: "",
      level: "",
      thumbnail: "",
      material: "",
      years: [],
      department: [],
    });
    setMcqs([]);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await axios.delete(`http://localhost:5000/delete-course/${id}`);
        fetchCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course.");
      }
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourse({
      name: course.name || "",
      level: course.level || "",
      thumbnail: course.thumbnail || "",
      material: course.material || "",
      years: Array.isArray(course.years || course.year)
        ? course.years || course.year
        : (course.years || course.year)?.split(",") || [],
      department: Array.isArray(course.department || course.departments)
        ? course.department || course.departments
        : (course.department || course.department)?.split(",") || [],
    });

    setMcqs(course.mcqs && Array.isArray(course.mcqs) ? course.mcqs : []);
    setShowForm(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !editingCourse) {
      alert("Please select a file and choose a course.");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("course_id", editingCourse.id);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/bulk-upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message || "Bulk upload successful!");

      const updatedCoursesResponse = await axios.get(
        "http://localhost:5000/courses"
      );
      setCourses(updatedCoursesResponse.data);

      const updatedCourse = updatedCoursesResponse.data.find(
        (course) => course.id === editingCourse.id
      );
      setMcqs(updatedCourse.mcqs);
    } catch (err) {
      console.error("Bulk upload failed:", err);
      alert("Upload failed. Please ensure format is correct.");
    }
  };

  const handleAIGenerateMCQs = async () => {
    if (!course.name.trim()) {
      alert("Please enter the course name first!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/generate-ai-mcqs", {
        courseName: course.name,
      });

      if (res.data && Array.isArray(res.data.mcqs)) {
        setMcqs([...mcqs, ...res.data.mcqs]);
        alert("AI generated MCQs added!");
      } else {
        alert("Failed to generate MCQs");
      }
    } catch (error) {
      console.error("AI MCQ generation error:", error);
      alert("Error generating AI MCQs");
    }
  };

  return (
    <div className="add-course-container">
      {!showForm && (
        <>
          <div className="adminpage-tophead">
            <h2 className="add-course-title">Courses</h2>
            <div className="filter-add">
              <div className="filter-toggle">
                <span
                  onClick={() => setShowFilter(!showFilter)}
                  style={{ fontSize: "22px", cursor: "pointer", marginTop: 2 }}
                >
                  <Filter />
                </span>
                {showFilter && (
                  <div className="course-filter">
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
                      placeholder={`Search by ${filterBy}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                )}
              </div>

              <div
                className="add-course-card-add"
                onClick={() => {
                  setShowForm(true);
                  handleClose();
                }}
              >
                <h6 className="add-course-plus">
                  Add<span className="plus">+</span>
                </h6>
              </div>
            </div>
          </div>
          <div className="add-course-grid">
            {filteredCourses.map((c) => (
              <div key={c.id} className="add-course-card">
                <img
                  src={c.thumbnail}
                  alt={c.name}
                  className="add-course-img"
                />
                <h2 className="coursename" style={{ textAlign: "center" }}>
                  {c.name}
                </h2>
                <div className="add-course-info">
                  <p>
                    <strong>Level</strong>: {c.level}
                  </p>
                  <p>
                    <strong>Year</strong>:{" "}
                    {Array.isArray(c.years) ? c.years.join(", ") : c.years}
                  </p>
                  <p>
                    <strong>Departments</strong>:{" "}
                    {Array.isArray(c.department)
                      ? c.department.join(", ")
                      : c.department}
                  </p>
                  <p>
                    {c.material ? (
                      <a
                        href={c.material}
                        target="_blank"
                        rel="noreferrer"
                        className="dec-material"
                      >
                        Material Link
                      </a>
                    ) : (
                      "_____"
                    )}
                  </p>
                </div>
                <div className="add-course-buttons">
                  <button
                    onClick={() => handleEditCourse(c)}
                    className="add-course-edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(c.id)}
                    className="add-course-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="add-course-form">
          <div className="top-close">
            <h2>{editingCourse ? "Edit Course Form" : "Add Course Form"}</h2>
            <button onClick={handleSubmit} className="top-edit-update">
              {editingCourse ? "Update" : "Update"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="edit-close"
              style={{ marginTop: 20 }}
            >
              Close
            </button>
          </div>
          <input
            type="text"
            placeholder="Course Name"
            value={course.name}
            onChange={(e) => setCourse({ ...course, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Level"
            value={course.level}
            onChange={(e) => setCourse({ ...course, level: e.target.value })}
          />
          <input
            type="text"
            placeholder="Thumbnail URL"
            value={course.thumbnail}
            onChange={(e) =>
              setCourse({ ...course, thumbnail: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Material Link"
            value={course.material}
            onChange={(e) => setCourse({ ...course, material: e.target.value })}
          />

          <div className="multi-select">
            <label>Select Years:</label>
            {[1, 2, 3, 4].map((yr) => (
              <label key={yr} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  value={yr}
                  checked={course.years.includes(String(yr))}
                  onChange={() => handleYearChange(String(yr))}
                />
                {yr} Year
              </label>
            ))}
          </div>

          <div className="multi-select">
            <label>Select Departments:</label>
            {["CSE", "IT", "EEE", "MECH"].map((dept) => (
              <label key={dept} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  value={dept}
                  checked={course.department.includes(dept)}
                  onChange={() => handleDepartmentChange(dept)}
                />
                {dept}
              </label>
            ))}
          </div>

          <div className="bulk-upload-section">
            <h2>Bulk Upload MCQs (CSV/XLSX)</h2>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setBulkFile(e.target.files[0])}
            />
            <button onClick={handleBulkUpload} className="edit-add-mcq">
              Upload File
            </button>
          </div>

          <h2>Edit MCQs</h2>
          <div className="add-crs-edit-mcqs-header">
            <h4 id="SerialNumber">S.No.</h4>
            <div className="space-btw-ques">
              <h4>Questions</h4>
              <h4>Option-1</h4>
              <h4>Option-2</h4>
              <h4>Option-3</h4>
              <h4>Option-4</h4>
              <h4>Answer</h4>
            </div>
          </div>
          {mcqs.map((mcq, index) => (
            <div key={mcq.id || index} className="add-course-mcq-box">
              <p>{index + 1}</p>
              <input
                type="text"
                placeholder="Question"
                value={mcq.question}
                onChange={(e) =>
                  handleMCQChange(index, "question", e.target.value)
                }
              />
              {[1, 2, 3, 4].map((num) => (
                <input
                  key={num}
                  type="text"
                  placeholder={`Option ${num}`}
                  value={mcq[`option${num}`]}
                  onChange={(e) =>
                    handleMCQChange(index, `option${num}`, e.target.value)
                  }
                />
              ))}
              <select
                value={mcq.correct_option}
                onChange={(e) =>
                  handleMCQChange(index, "correct_option", e.target.value)
                }
              >
                {[1, 2, 3, 4].map((opt) => (
                  <option key={opt} value={opt}>
                    Option {opt}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleDeleteMCQ(mcq.id, index)}
                className="mcqs-delete-btn"
                style={{ width: 60 }}
              >
                Delete
              </button>
            </div>
          ))}
          <div className="add-course-edit-btns">
            <button onClick={handleAddMCQ} className="edit-add-mcq">
              Add MCQ
            </button>
            <button onClick={handleAIGenerateMCQs} className="edit-add-mcq">
              Generate MCQs Using AI
            </button>
            <button onClick={handleSubmit} className="edit-update">
              {editingCourse ? "Update" : "Submit"}
            </button>
            <button onClick={() => setShowForm(false)} className="edit-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Addcourses;
