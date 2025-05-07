import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Testportal.css";
import img from "../../assets/testportal.png";
import { addHours, differenceInSeconds } from "date-fns";

function Testportal() {
  const [bookedSlot, setBookedSlot] = useState(null);
  const [isSlotActive, setIsSlotActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [noSlotMessage, setNoSlotMessage] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [instructionsAccepted, setInstructionsAccepted] = useState([]);
  const [studentInfo, setStudentInfo] = useState({});
  const [showReviewRequest, setShowReviewRequest] = useState(false);
  const [score, setScore] = useState(0);
  const [userDetails, setUserDetails] = useState(null);

  const navigate = useNavigate();
  const userId = localStorage.getItem("id");
  const answersRef = useRef({});
  const timerRef = useRef(null);
  const instructions = [
    "The test must be completed within the allocated time, and the test is auto-submitted after the allotted time.",
    "Students must take the exam independently without external help.",
    "Any suspicious activity, such as looking away frequently, opening new tabs, or receiving external help, may result in disqualification.",
    "Taking screenshots, recording, or distributing exam materials is strictly prohibited and may result in disciplinary action.",
    "Any student found violating exam rules may face penalties, including: Disqualification from the exam, Score cancellation, Academic penalties or disciplinary actions as per college policies",
    "I agree to abide by the academic integrity policies of BIT",
  ];

  useEffect(() => {
    fetchBookedSlot();
    fetchUserDetails();
    fetchStudentInfo();
  }, []);
  useEffect(() => {
    if (bookedSlot && isSlotActive) {
      fetchMCQs(bookedSlot.course_id);
    }
  }, [bookedSlot, isSlotActive]);
  useEffect(() => {
    const savedTime = localStorage.getItem("timeLeft");
    if (savedTime) {
      setTimeLeft(Number(savedTime));
    }

    const savedAnswers = localStorage.getItem("answers");
    if (savedAnswers) {
      answersRef.current = JSON.parse(savedAnswers);
    }
  }, []);
  useEffect(() => {
    if (questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitTest();
            return 0;
          }
          localStorage.setItem("timeLeft", prev - 1);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [questions]);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your test progress will be lost.";
    };

    if (!showInstructions && questions.length > 0 && !showReviewRequest) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showInstructions, questions, showReviewRequest]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/user/${userId}`); //already in profile page
      setUserDetails(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchStudentInfo = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/student-info/${userId}`
      );
      setStudentInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch student info", err);
    }
  };

  const fetchBookedSlot = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/user-bookings/${userId}` //already in profile page
      );

      if (res.data.length === 0) {
        setNoSlotMessage(true);
        setTimeout(() => navigate("/studentnavbar"), 3000);
      } else {
        const slot = res.data[0];
        setBookedSlot(slot);

        const currentTime = new Date();
        const slotStartTime = new Date(slot.slot_time);
        const slotEndTime = addHours(slotStartTime, 1);

        if (currentTime > slotEndTime) {
          try {
            await axios.post("http://localhost:5000/store-score", { //already in profile page
              userId,
              courseId: slot.course_id,
              score: 0,
            });

            await axios.delete(
              `http://localhost:5000/delete-booking/${slot.id}` //already in profile page
            );
            navigate("/");
          } catch (err) {
            console.error(
              "Error during auto submission after slot expiry",
              err
            );
          }
          return;
        }

        const secondsLeft = differenceInSeconds(slotEndTime, currentTime);
        setTimeLeft(secondsLeft > 0 ? secondsLeft : 0);

        if (currentTime >= slotStartTime && currentTime <= slotEndTime) {
          setIsSlotActive(true);
        } else {
          setIsSlotActive(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch booked slot", err);
    }
  };

  const fetchMCQs = async (courseId) => {
    const storedQuestions = localStorage.getItem(`questions_${courseId}`);
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    } else {
      try {
        const res = await axios.get(
          `http://localhost:5000/get-mcqs/${courseId}`
        );
        setQuestions(res.data);
        localStorage.setItem(`questions_${courseId}`, JSON.stringify(res.data));
      } catch (err) {
        console.error("Failed to fetch questions", err);
      }
    }
  };

  const handleOptionChange = (questionId, selectedOption) => {
    answersRef.current[questionId] = String(selectedOption);
    localStorage.setItem("answers", JSON.stringify(answersRef.current));
  };

  const clearSelectedOption = (qid) => {
    if (qid) {
      delete answersRef.current[qid];
      localStorage.setItem("answers", JSON.stringify(answersRef.current));
    }
  };

  const submitTest = async () => {
    clearInterval(timerRef.current);

    let calculatedScore = 0;
    questions.forEach((q) => {
      if (answersRef.current[q.id] === String(q.correct_option)) {
        calculatedScore++;
      }
    });

    try {
      await axios.post("http://localhost:5000/store-score", { //already in profile page
        userId,
        courseId: bookedSlot.course_id,
        score: calculatedScore,
      });

      await axios.delete(
        `http://localhost:5000/delete-booking/${bookedSlot.id}` //already in profile page
      );

      setScore(calculatedScore);
      setShowReviewRequest(true);
    } catch (err) {
      console.error("Error submitting test:", err);
    }
  };

  const startTest = () => {
    fetchMCQs(bookedSlot.course_id);
    setShowInstructions(false);
  };

  const formatSlotTime = (slotTimeStr) => {
    const date = new Date(slotTimeStr);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const ReviewRequest = () => {
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [comments, setComments] = useState({});
    const isEligible = score / questions.length >= 0;

    const handleCheckboxChange = (qid) => {
      const isSelected = selectedQuestions.includes(qid);
      let updatedSelections;

      if (isSelected) {
        updatedSelections = selectedQuestions.filter((id) => id !== qid);
      } else {
        if (selectedQuestions.length >= 2) {
          alert("You can select up to 2 questions only.");
          return;
        }
        updatedSelections = [...selectedQuestions, qid];
      }

      setSelectedQuestions(updatedSelections);

      if (isSelected) {
        const updatedComments = { ...comments };
        delete updatedComments[qid];
        setComments(updatedComments);
      } else {
        setComments({ ...comments, [qid]: "" });
      }
    };

    const handleCommentChange = (qid, value) => {
      setComments((prev) => ({
        ...prev,
        [qid]: value,
      }));
    };

    const handleSubmit = async () => {
      try {
        for (const qid of selectedQuestions) {
          await axios.post("http://localhost:5000/submit-review", {
            userId,
            courseId: bookedSlot.course_id,
            question_number: qid,
            comment: comments[qid],
          });
        }
        alert("Reviews submitted successfully!");
        logout();
      } catch (err) {
        alert("Please fill all the fields before submitting.");
        console.error(err);
      }
    };

    return (
      <div className="test-container">
        <h2>
          Total Score: {score}/{questions.length}
        </h2>
        <div style={{ justifyContent: "center", marginLeft: "45px" }}>
          <p>
            Eligible for Review: <strong>{isEligible ? "Yes" : "No"}</strong>
          </p>

          {isEligible ? (
            <>
              <div>
                <h4>Select up to 2 Questions:</h4>
                <div className="question-grid">
                  {questions.map((q, i) => (
                    <div key={q.id} className="question-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q.id)}
                          onChange={() => handleCheckboxChange(q.id)}
                        />
                        Question {i + 1}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuestions.map((qid) => {
                const questionIndex = questions.findIndex((q) => q.id === qid);
                return (
                  <div key={qid} style={{ marginTop: "20px" }}>
                    <label>
                      Comment for Question {questionIndex + 1}:
                      <textarea
                        id="comment-textarea"
                        value={comments[qid] || ""}
                        onChange={(e) =>
                          handleCommentChange(qid, e.target.value)
                        }
                        placeholder="Enter your comment here"
                        style={{ width: "93%", height: "70px" }}
                      />
                    </label>
                  </div>
                );
              })}

              <div id="button-row" style={{ marginTop: "20px" }}>
                <button id="submit-btn" onClick={handleSubmit}>
                  Submit Review
                </button>
                <button id="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button id="logout-btn" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    );
  };

  if (noSlotMessage) {
    return (
      <div className="test-container">
        <h2>No slot booked!</h2>
        <p>Redirecting to Profile in 3 seconds...</p>
      </div>
    );
  }

  if (!bookedSlot) return <p>Loading...</p>;

  if (!isSlotActive) {
    return (
      <div className="test-container">
        <h2>Your test has not started yet.</h2>
        <p>Slot Time: {formatSlotTime(bookedSlot.slot_time)}</p>
        <p>Please return at the scheduled time to access the test portal.</p>
      </div>
    );
  }

  if (showReviewRequest) return <ReviewRequest />;

  if (showInstructions) {
    return (
      <div>
        <div className="instruction-head">
          <img src={img} alt="logo" className="head-logo"></img>
          <h1>Test Portal</h1>
        </div>
        <div className="test-container">
          <h2>Instructions</h2>
          <div className="instructions">
            <ul className="instructions-list">
              {instructions.map((inst, idx) => (
                <li key={idx}>
                  <label>
                    <input
                      type="checkbox"
                      checked={instructionsAccepted.includes(idx)}
                      onChange={(e) =>
                        setInstructionsAccepted((prev) =>
                          e.target.checked
                            ? [...prev, idx]
                            : prev.filter((i) => i !== idx)
                        )
                      }
                    />
                    {inst}
                  </label>
                </li>
              ))}
            </ul>
            <label className="accept-all">
              <input
                type="checkbox"
                checked={instructionsAccepted.length === instructions.length}
                onChange={(e) =>
                  setInstructionsAccepted(
                    e.target.checked ? instructions.map((_, i) => i) : []
                  )
                }
              />
              I accept all the above mentioned instructions
            </label>
            <p className="motivational-quote">“All the Best!”</p>
          </div>
          <div className="course-info">
            <img src={bookedSlot.thumb_nail} alt="Course" />
            <div>
              <p>
                <strong>Course:</strong> {bookedSlot.course_name}
              </p>
              <p>
                <strong>Level:</strong> {bookedSlot.level}
              </p>
              <p>
                <strong>Time:</strong> {formatSlotTime(bookedSlot.slot_time)}
              </p>
              <p>
                <strong>Venue:</strong> {bookedSlot.venue}
              </p>
              <button
                className="start-button"
                disabled={instructionsAccepted.length !== instructions.length}
                onClick={startTest}
              >
                Start Test!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <p>Loading question...</p>;

  return (
    <div className="testpage-container">
      <div className="testpage-header">
        <div className="testpage-profile">
          <img
            src={userDetails.image}
            alt={userDetails.name}
            className="testpage-profile-img"
          />
          <div className="testpage-profile-details">
            <p>
              <strong>Student Name:</strong> {studentInfo.name}
            </p>
            <p>
              <strong>Reg. Number:</strong> {userDetails.register_number}
            </p>
            <p>
              <strong>Course:</strong>{" "}
              {bookedSlot.course_name + " (Lvl-" + bookedSlot.level + ")"}
            </p>
          </div>
        </div>
        <div className="testpage-meta">
          <p>
            <strong>Time Left:</strong> {formatTime(timeLeft)}
          </p>
          <button onClick={submitTest} className="testpage-finish-btn">
            Finish Test
          </button>
        </div>
      </div>

      <div className="testpage-question-box">
        <p className="testpage-question">
          <strong>Question {currentQuestionIndex + 1}:</strong>{" "}
          {currentQuestion.question}
        </p>
        {["option1", "option2", "option3", "option4"].map((key, i) => {
          const selectedValue = answersRef.current[currentQuestion.id];
          const optionValue = String(i + 1);

          return (
            <label
              key={i}
              className={`testpage-option ${selectedValue === optionValue ? "selected" : ""}`}
              onClick={(e) => {
                e.preventDefault();

                if (selectedValue === optionValue) {
                  clearSelectedOption(currentQuestion.id);
                } else {
                  handleOptionChange(currentQuestion.id, i + 1);
                }
              }}
            >
              <input
                type="radio"
                name={`question_${currentQuestion.id}`}
                value={optionValue}
                checked={selectedValue === optionValue}
                readOnly
              />
              <span>{currentQuestion[key]}</span>
            </label>
          );
        })}
      </div>

      <div className="testpage-nav-buttons">
        <button
          onClick={() =>
            setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
          }
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentQuestionIndex((prev) =>
              Math.min(prev + 1, questions.length - 1)
            )
          }
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </button>
      </div>

      <div className="testpage-question-grid">
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={`testpage-qbtn ${answersRef.current[q.id] ? "answered" : "unanswered"}`}
            onClick={() => setCurrentQuestionIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Testportal;
