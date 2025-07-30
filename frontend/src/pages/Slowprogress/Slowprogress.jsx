import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { Filter } from "lucide-react";
import "../Slowprogress/Slowprogress.css";

const Slowprogress = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [showFilter, setShowFilter] = useState(true);
  const [filterBy, setFilterBy] = useState("Registerno");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/leaderboard")
      .then((response) => {
        setLeaderboard(response.data.reverse());
      })
      .catch((error) => {
        console.error("Error fetching leaderboard:", error);
      });
  }, []);

  const filterOptions = [
    { value: "Rank", label: "Rank" },
    { value: "Name", label: "Name" },
    { value: "Registerno", label: "Register Number" },
    { value: "Level Completed", label: "Level Completed" },
    { value: "Specialization", label: "Specialization" },
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

  const filteredLeaderboard = leaderboard.filter((student, index) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    switch (filterBy) {
      case "Rank":
        return (leaderboard.length - index).toString().includes(term);
      case "Name":
        return student.name?.toLowerCase().includes(term);
      case "Registerno":
        return student.register_number?.toLowerCase().includes(term);
      case "Level Completed":
        return student.level_completed?.toString().includes(term);
      case "Specialization":
        return student.highest_level_course?.toLowerCase().includes(term);
      default:
        return true;
    }
  });

  return (
    <>
    <div className="slow-progress-table-container">
      <h2 className="slow-progress-title">Slow Progress</h2>

      <div className={`slow-progress-filter-bar ${!showFilter ? "collapsed" : ""}`}>
  <span
    onClick={() => setShowFilter(!showFilter)}
    className="slow-progress-filter-toggle-icon"
    style={{
      fontSize: "22px",
      cursor: "pointer",
      marginRight: 0,
    }}
  >
    <Filter />
  </span>

  {showFilter && (
    <div className="slow-progress-select-wrapper">
      <Select
        value={filterOptions.find((opt) => opt.value === filterBy)}
        onChange={(selected) => setFilterBy(selected.value)}
        options={filterOptions}
        styles={customStyles}
        placeholder="Filter by"
        className="slow-progress-select"
      />

      <input
        type="text"
        className="slow-progress-filter-input"
        placeholder={`Search by ${filterBy}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )}
</div>

    </div>

      <table className="slow-progress-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Rank</th>
            <th>Name</th>
            <th>Registerno</th>
            <th>Level Completed</th>
            <th>RP</th>
            <th>Specialization</th>
            <th>Placement Points</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeaderboard.map((student, index) => (
            <tr key={student.id || index} className="slow-progress-row">
              <td>{index + 1}</td>
              <td>{leaderboard.length - leaderboard.indexOf(student)}</td>
              <td>{student.name}</td>
              <td>{student.register_number}</td>
              <td>
                {student.level_completed != "0"
                  ? student.level_completed
                  : "-"}
              </td>
              <td>
                {student.level_completed != "0"
                  ? student.level_completed * 900
                  : "-"}
              </td>
              <td>
                {student.level_completed != "0"
                  ? student.highest_level_course
                  : "-"}
              </td>
              <td>
                {student.level_completed != "0"
                  ? student.level_completed * 5
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </>
  );
};

export default Slowprogress;
