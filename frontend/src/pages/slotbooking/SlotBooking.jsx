import React, { useEffect, useState } from "react";
import axios from "axios";
import "../slotbooking/slotbooking.css";
import Select from "react-select";

function SlotBooking() {
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bookingCourseId, setBookingCourseId] = useState(null);
  const [venue, setVenue] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const userId = localStorage.getItem("id");

  const venueOptions = [
    "Mech - Lab - 1",
    "Mech - Lab - 2",
    "CAD - Lab",
    "IT - Lab - 1",
    "Dig.Lib",
  ];
  const slotTimeOptions = [
    "09:00 AM - 10:00AM",
    "10:30 AM - 11:30 AM",
    "12:00 PM - 01:00 PM",
    "01:30 PM - 02:30 PM",
    "03:00 PM - 04:00 PM",
  ];

  const venueSelectOptions = venueOptions.map((v) => ({
    label: v,
    value: v,
  }));

  const slotSelectOptions = slotTimeOptions.map((s) => ({
    label: s,
    value: s,
  }));
  useEffect(() => {
    fetchRegisteredCourses();
  }, []);

  const fetchRegisteredCourses = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/registered-courses/${userId}`
      );
      setRegisteredCourses(response.data);

      const responses = await axios.get(
        `http://localhost:5000/user-bookings/${userId}` //already in profile page
      );
      setCourses(responses.data);
    } catch (error) {
      console.error("Error fetching registered courses:", error);
    }
  };

  const handleBookSlot = async (courseId) => {
    if (!venue || !slotTime) {
      alert("Please select both venue and slot time.");
      return;
    }

    const convertTo24Hour = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    };

    const startTime = slotTime.split(" - ")[0];
    const formattedSlotTime = convertTo24Hour(startTime);
    const currentDate = new Date().toISOString().split("T")[0];

    try {
      const response = await axios.post("http://localhost:5000/book-course", {
        user_id: userId,
        course_id: courseId,
        venue,
        slot_time: `${currentDate} ${formattedSlotTime}`,
      });

      setBookingCourseId(null);
      setVenue("");
      setSlotTime("");
      fetchRegisteredCourses();
    } catch (error) {
      console.error(
        "Error booking slot:",
        error.response ? error.response.data : error.message
      );
      alert("Failed to book slot. Check console.");
    }
  };

  const hasBookedSlot = courses.some((course) => course.slot_time);

  return (
    <div className="slotbooking-container">
      <h2 className="slotbooking-title">Registered Courses</h2>
      <div className="slotbooking-course-list">
        {registeredCourses.map((course) => (
          <div className="slotbooking-course-card" key={course.course_id}>
            <img src={course.thumb_nail} alt={course.name} />
            <h3>{course.course_name}</h3>
            <p>Level: {course.level}</p>
            <p>Attempts: {course.attempts}</p>
            <p>
              <a
                href={course.material}
                target="_blank"
                rel="noopener noreferrer"
              >
                Course Material
              </a>
            </p>

            {course.slot_time ? (
              <p>
                <strong>Slot Booked:</strong> {course.slot_time} at{" "}
                {course.venue}
              </p>
            ) : hasBookedSlot ? (
              <p className="slotbooking-error-message">
                You have already booked a slot for another course.
              </p>
            ) : (
              <div>
                <button
                  onClick={() => setBookingCourseId(course.course_id)}
                  className="slotbooking-button"
                >
                  Book Now
                </button>

                {bookingCourseId && (
                  <div className="slotbooking-modal-overlay">
                    <div className="slotbooking-modal">
                      <div className="slotbooking-modal-header">
                        <h3>Confirm Booking</h3>
                        <p>
                          Please select venue and slot time for your course
                          booking.
                        </p>
                      </div>
                      <div style={{ marginBottom: "16px" }}>
                        <label>Venue</label>
                        <Select
                          options={venueSelectOptions}
                          value={venueSelectOptions.find(
                            (opt) => opt.value === venue
                          )}
                          onChange={(selected) => setVenue(selected.value)}
                          placeholder="Select Venue"
                          styles={{
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isFocused
                                ? "#e3f2fd"
                                : "white",
                              color: "black",
                            }),
                            control: (provided) => ({
                              ...provided,
                              borderColor: "#ccc",
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: "#1976d2",
                              },
                            }),
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <label>Slot Time</label>
                        <Select
                          options={slotSelectOptions}
                          value={slotSelectOptions.find(
                            (opt) => opt.value === slotTime
                          )}
                          onChange={(selected) => setSlotTime(selected.value)}
                          placeholder="Select Slot Time"
                          styles={{
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isFocused
                                ? "#e3f2fd"
                                : "white",
                              color: "black",
                            }),
                            control: (provided) => ({
                              ...provided,
                              borderColor: "#ccc",
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: "#1976d2",
                              },
                            }),
                          }}
                        />
                      </div>

                      <div className="slotbooking-modal-buttons">
                        <button
                          onClick={() => setBookingCourseId(null)}
                          className="slotbooking-conformation-button-cancel"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleBookSlot(bookingCourseId)}
                          className="slotbooking-conformation-button-confirm"
                        >
                          Confirm Booking
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlotBooking;
