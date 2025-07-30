import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import Select from "react-select";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function Profile() {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("id"));
  const [userDetails, setUserDetails] = useState(null);
  const [graphCourses, setgraphCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [selectedYear, setSelectedYear] = useState("All");

  useEffect(() => {
    fetchUserDetails();
    fetchUserBookings();
    fetchgraphCourses();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (userDetails && filteredLeaderboard) {
      const leaderboardEntry = filteredLeaderboard.find(
        (entry) => entry.id === userDetails.id
      );

      if (leaderboardEntry) {
        setUserDetails((prev) => ({
          ...prev,
          level_completed: leaderboardEntry.level_completed,
          highest_level_course: leaderboardEntry.highest_level_course,
        }));
      }
    }
  }, [leaderboard]);

  useEffect(() => {
    filterLeaderboard();
  }, [selectedYear, leaderboard]);

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

  const fetchLeaderboard = () => {
    axios
      .get(`http://localhost:5000/api/leaderboard`)
      .then((response) => {
        setLeaderboard(response.data);
        setFilteredLeaderboard(response.data); // Initialize filtered leaderboard
      })
      .catch((error) => {
        console.error("Error fetching leaderboard:", error);
      });
  };

  const filterLeaderboard = () => {
    if (selectedYear === "All") {
      setFilteredLeaderboard(leaderboard);
    } else {
      const filtered = leaderboard.filter(
        (student) => student.year === parseInt(selectedYear.split("-")[1])
      );

      // Update the filtered leaderboard
      setFilteredLeaderboard(filtered);
    }

    // Merge the properties into userDetails if found
  };

  const yearOptions = [
    { value: "All", label: "All" },
    { value: "Year-1", label: "Year-1" },
    { value: "Year-2", label: "Year-2" },
    { value: "Year-3", label: "Year-3" },
    { value: "Year-4", label: "Year-4" },
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

  const chartData = graphCourses.map((course) => ({
    name: course.name,
    Level: course.level,
  }));

  const highestLevel = Math.max(
    ...(chartData.map((course) => course.Level) || 0)
  );

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

  return (
    <div className="Dashboard">
      <div className="Profile-top">
        <div className="student-profile">
          {userDetails && (
            <div className="profile-section">
              <h3 className="profile-heading">Student Profile</h3>
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section-table">
          <div className="leaderboard-top">
            <h2 className="leaderboard-heading">Leaderboard</h2>
            <div className="leaderboard-filter">
              <Select
                value={yearOptions.find((opt) => opt.value === selectedYear)}
                onChange={(selected) => setSelectedYear(selected.value)}
                options={yearOptions}
                styles={customStyles}
              />
            </div>
          </div>
          <div className="leaderboard-table">
            <div className="table-header">
              <span>Rank</span>
              <span>Name</span>
              <span>Registerno</span>
              <span>Level Completed</span>
              <span>RP</span>
              <span>Specialization</span>
              <span>Placement Points</span>
            </div>
            <div className="leaderboard-content">
              {filteredLeaderboard.map((student, index) => (
                <div
                  key={student.id}
                  className={`table-row ${
                    userDetails && student.name === userDetails.name
                      ? "highlight-row"
                      : ""
                  }`}
                >
                  <span>{index + 1}</span>
                  <span>{student.name}</span>
                  <span>{student.register_number}</span>
                  <span>
                    {student.level_completed != "0"
                      ? student.level_completed
                      : "-"}
                  </span>
                  <span>
                    {student.level_completed != "0"
                      ? student.level_completed * 900
                      : "-"}
                  </span>
                  <span>
                    {student.level_completed != "0"
                      ? student.highest_level_course
                      : "-"}
                  </span>
                  <span>
                    {student.level_completed != "0"
                      ? student.level_completed * 5
                      : "-"}
                  </span>
                </div>
              ))}

              {/* Highlighted Row at the Bottom */}
              {userDetails && (
                <div className="table-row highlight-row sticky-row">
                  <span>
                    <span>📌</span>
                    {filteredLeaderboard.findIndex(
                      (student) => student.name === userDetails.name
                    ) + 1}
                  </span>
                  <span>{userDetails.name}</span>
                  <span>{userDetails.register_number}</span>
                  <span>
                    {userDetails.level_completed !== "0"
                      ? userDetails.level_completed
                      : "-"}
                  </span>
                  <span>
                    {userDetails.level_completed !== "0"
                      ? userDetails.level_completed * 900
                      : "-"}
                  </span>
                  <span>
                    {userDetails.level_completed !== "0"
                      ? userDetails.highest_level_course
                      : "-"}
                  </span>
                  <span>
                    {userDetails.level_completed !== "0"
                      ? userDetails.level_completed * 5
                      : "-"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-bottom">

        <div className="graph-section">
          <div>
            <h2 className="graph-heading">Analysis</h2>
            <div className="graph-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis ticks={yAxisTicks} tickFormatter={(value) => value} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#1976d2" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Level"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="slot-section">
          {bookedSlots.length > 0 ? (
            <div>
              <h5 className="my-slot-heading">My Booked Slots</h5>
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
        
      </div>
    </div>
  );
}

export default Profile;
