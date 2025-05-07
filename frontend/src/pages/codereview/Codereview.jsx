import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Codereview.css";

function Codereview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("id");

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setError("User ID is required to fetch reviews.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/student-reviews/${userId}`
        );
        setReviews(response.data);
      } catch (err) {
        const message =
          err.response?.data?.error ||
          "Error fetching reviews. Please try again later.";
        setError(message);
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div className="loading-text">Loading...</div>;
  if (error) return <div className="error-text">{error}</div>;

  return (
    <div className="codereview-container">
      <h2>Review Updates</h2>
      {reviews.length === 0 ? (
        <p className="no-reviews">You haven't submitted any reviews yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="review-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Review Question</th>
                <th>Created At</th>
                <th>My Comment</th>
                <th>Status</th>
                <th>Admin Update</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                let courseCounter = 1;
                let lastGroupKey = "";

                for (let i = 0; i < reviews.length; i++) {
                  const current = reviews[i];
                  const groupKey = `${current.course_name}-${current.level}-${current.created_at}`;

                  const isSameGroup = groupKey === lastGroupKey;

                  const groupLength = reviews.filter(
                    (r) =>
                      r.course_name === current.course_name &&
                      r.level === current.level &&
                      r.created_at === current.created_at
                  ).length;

                  if (!isSameGroup) lastGroupKey = groupKey;

                  rows.push(
                    <tr key={current.id}>
                      {!isSameGroup && (
                        <>
                          <td rowSpan={groupLength}>{courseCounter++}</td>
                          <td rowSpan={groupLength}>
                            {current.course_name} (Level-{current.level})
                          </td>
                          <td rowSpan={groupLength}>
                            {formatDate(current.created_at)}
                          </td>
                        </>
                      )}
                      <td>{current.comment}</td>
                      <td>
                        <span
                          className={
                            current.status === "Reviewed"
                              ? "status-reviewed"
                              : current.status === "Pending"
                                ? "status-pending"
                                : "status-error"
                          }
                        >
                          {current.status}
                        </span>
                      </td>
                      <td>
                        {current.status === "Reviewed"
                          ? current.admin_feedback ||
                            "No feedback available yet."
                          : current.status === "Pending"
                            ? "Your review is still pending."
                            : "There was an issue with your review status."}
                      </td>
                    </tr>
                  );
                }

                return rows;
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Codereview;
