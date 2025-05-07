import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

function Profile() {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("id"));
  const [userDetails, setUserDetails] = useState(null);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [graphCourses, setgraphCourses] = useState([]);

  useEffect(() => {
    fetchUserDetails();
    fetchUserBookings();
    fetchCompletedCourses();
    fetchgraphCourses();
  }, []);

  const fetchUserDetails = () => {
    axios
      .get(`http://localhost:5000/user/${userId}`)
      .then((response) => {
        setUserDetails(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  };

  const fetchUserBookings = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/user-bookings/${userId}`
      );
      const currentTime = new Date();
      const updatedSlots = [];

      for (const slot of response.data) {
        const slotStartTime = new Date(slot.slot_time);
        const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000);

        if (currentTime > slotEndTime) {
          try {
            await axios.post("http://localhost:5000/store-score", {
              userId,
              courseId: slot.course_id,
              score: 0,
            });

            await axios.delete(
              `http://localhost:5000/delete-booking/${slot.id}`
            );
            console.log(
              `Auto-submitted score 0 and removed expired slot ${slot.id}`
            );
          } catch (error) {
            console.error("Error auto-submitting expired slot:", error);
          }
        } else {
          updatedSlots.push({
            ...slot,
            slot_time: formatSlotTime(slot.slot_time),
          });
        }
      }

      setBookedSlots(updatedSlots);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  };

  const fetchCompletedCourses = () => {
    axios
      .get(`http://localhost:5000/api/users/${userId}/completed-courses`)
      .then((response) => {
        setCompletedCourses(response.data);
      })
      .catch((error) => {
        console.error("Error fetching completed courses:", error);
      });
  };
  const fetchgraphCourses = () => {
    axios
      .get(`http://localhost:5000/api/users/${userId}/graph-courses`)
      .then((response) => {
        setgraphCourses(response.data);
      })
      .catch((error) => {
        console.error("Error fetching graph courses:", error);
      });
  };
  const formatSlotTime = (slotTime) => {
    if (!slotTime) return "N/A";
    const date = new Date(slotTime);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const chartData = graphCourses.map((course, index) => ({
    name: course.name,
    Level: course.level,
  }));
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#e3eefa",
            color: "#000",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
          <p style={{ margin: 0 }}>Level: {payload[0].value}</p>
        </div>
      );
    }

    return null;
  };
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };
  const maxLevel = Math.max(...chartData.map((item) => item.Level));
  const yAxisTicks = Array.from({ length: maxLevel + 1 }, (_, i) => i);
  const totalLevel = completedCourses.reduce((sum) => sum + 1, 0);
  return (
    <div className="Dashboard">
      <div className="Profile-top">
        <div className="student-profile">
          {userDetails && (
            <div className="profile-section">
              <h2 className="profile-heading">Student Profile</h2>
              <div className="profile-card">
                <img
                  src={userDetails.image}
                  alt={userDetails.name}
                  className="profile-image"
                />
                <div className="profile-info">
                  <p>
                    <strong>Name:</strong> {userDetails.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userDetails.email}
                  </p>
                  <p>
                    <strong>Reg. Number:</strong> {userDetails.register_number}
                  </p>
                  <p>
                    <strong>Department:</strong> {userDetails.department}
                  </p>
                  <p>
                    <strong>Level:</strong> {totalLevel}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="completed-courses">
          {/* {completedCourses.length > 0 && ( */}
          <>
            <h2 className="completed-heading">Completed Courses</h2>
            <div className="completed-section">
              <div className="completed-table">
                <div className="table-header">
                  <span>Course</span>
                  <span>Level</span>
                  <span>Score</span>
                  <span>Date</span>
                  <span>Attempt</span>
                </div>
                <div className="outer-scroll-area">
                  <div className="completed-content">
                    {completedCourses.map((course) => (
                      <div key={course.id} className="table-row">
                        <span>{course.name}</span>
                        <span>{course.level}</span>
                        <span>{course.score}</span>
                        <span>{formatDate(course.test_date)}</span>
                        <span>{course.attempts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
          {/* )} */}
        </div>
      </div>

      <div className="profile-bottom">
        <div className="slot-section">
          {bookedSlots.length > 0 ? (
            <div>
              <h2 className="my-slot-heading">My Booked Slots</h2>
              {bookedSlots.map((slot) => (
                <div key={slot.course_id} className="my-slot-card">
                  <img
                    src={slot.thumb_nail}
                    alt={slot.course_name}
                    className="my-slot-thumbnail"
                  />
                  <div className="my-slot-details">
                    <div className="my-slot-course-name">
                      Course: {slot.course_name}
                    </div>
                    <div className="my-slot-detail">Levels: {slot.level}</div>
                    <div className="my-slot-detail">Venue: {slot.venue}</div>
                    <div className="my-slot-detail">Time: {slot.slot_time}</div>
                    <div className="my-slot-link">
                      <a
                        href={slot.material}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Course Material
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <h2 className="my-slot-heading">My Booked Slots</h2>
              <div className="no-slots-box">
                <p>No slots booked yet.</p>
              </div>
            </>
          )}
        </div>
        <div className="graph-section">
          {/* {graphCourses.length > 0 && ( */}
          <div>
            <h2 className="graph-heading">Analysis</h2>
            <div style={{ width: 800, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis ticks={yAxisTicks} tickFormatter={(value) => value} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "none" }}
                  />
                  <Bar dataKey="Level" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === hoveredIndex ? "#1976d2" : "#e3eefa"}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* )} */}
        </div>
      </div>
    </div>
  );
}

export default Profile;
