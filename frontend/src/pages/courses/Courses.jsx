import React, { useEffect, useState } from "react";
import axios from "axios";
import PositionedSnackbar from "../../components/PositionedSnackbar";
import "../courses/courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarTrigger, setSnackbarTrigger] = useState(false);

  const userId = localStorage.getItem("id");



  
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/courses/${userId}`
      );
      const allCourses = response.data;

      const completed = await Promise.all(
        allCourses.map(async (course) => {
          const res = await axios.get(
            `http://localhost:5000/course-completion/${userId}/${course.id}`
          );
          return res.data.completed ? course.id : null;
        })
      );

      setCourses(allCourses);
      setCompletedCourses(completed.filter(Boolean));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleRegister = async (courseId, materialLink) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/register-course",
        {
          user_id: userId,
          course_id: courseId,
          material_link: materialLink,
        }
      );

      setSnackbarMessage(response.data.message);
      setSnackbarTrigger((prev) => !prev);
      fetchCourses();
    } catch (error) {
      setSnackbarMessage(
        error.response?.data?.message || "Registration failed. Try again."
      );
      setSnackbarTrigger((prev) => !prev);
    }
  };

  const groupedCourses = courses.reduce((acc, course) => {
    acc[course.name] = acc[course.name] || [];
    acc[course.name].push(course);
    return acc;
  }, {});

  return (
    <div className="course-container">
      <h2 className="available-course-title">Available Courses</h2>
      <div className="card-grid">
        {Object.entries(groupedCourses).map(([courseName, courseGroup]) => {
          const sortedCourses = courseGroup.sort(
            (a, b) => parseInt(a.level) - parseInt(b.level)
          );

          let nextCourse = null;
          for (let i = 0; i < sortedCourses.length; i++) {
            const course = sortedCourses[i];
            const isCompleted = completedCourses.includes(course.id);
            const eligible =
              i === 0 || completedCourses.includes(sortedCourses[i - 1].id);

            if (!isCompleted && eligible) {
              nextCourse = course;
              break;
            }
          }

          if (!nextCourse) {
            const lastCourse = sortedCourses[sortedCourses.length - 1];
            return (
              <div key={`${courseName}-completed`} className="course-card">
                <img
                  src={lastCourse.thumbnail}
                  alt={lastCourse.name}
                  className="course-image"
                />
                <h3 className="course-name">{lastCourse.name}</h3>
                <p className="course-level">Level: {lastCourse.level}</p>
                <button
                  className="register-button"
                  style={{
                    backgroundColor: "green",
                    cursor: "not-allowed",
                    color: "white",
                  }}
                  disabled
                >
                  Completed
                </button>
              </div>
            );
          }

          return (
            <div key={nextCourse.id} className="course-card">
              <img
                src={nextCourse.thumbnail}
                alt={nextCourse.name}
                className="course-image"
              />
              <h3 className="course-name">{nextCourse.name}</h3>
              <p className="course-level">Level: {nextCourse.level}</p>
              <button
                className="register-button"
                onClick={() =>
                  handleRegister(nextCourse.id, nextCourse.material_link)
                }
              >
                Register
              </button>
            </div>
          );
        })}
      </div>

      <PositionedSnackbar message={snackbarMessage} trigger={snackbarTrigger} />
    </div>
  );
}

export default Courses;
