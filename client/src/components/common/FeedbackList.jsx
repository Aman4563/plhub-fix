// import React from 'react';
// import Spreadsheet from 'react-spreadsheet';
// import styled from 'styled-components';
// import { saveAs } from 'file-saver'; // Import file-saver for downloading

// const StyledSpreadsheetDisplay = styled.div`
//     padding: 20px;
//     border: 1px solid #ccc;
//     border-radius: 5px;
//     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

//     h2 {
//         margin-bottom: 15px;
//         color: #333;
//     }

//     .download-button {
//         margin-top: 15px;
//         background-color: #007bff;
//         color: #fff;
//         border: none;
//         border-radius: 5px;
//         padding: 10px 20px;
//         cursor: pointer;

//         &:hover {
//             background-color: #0056b3;
//         }
//     }
// `;

// const SpreadsheetDisplay = ({ data }) => {
//     const handleDownload = () => {
//         const csvData = data.map(row => row.map(cell => cell.value).join(',')).join('\n');
//         const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
//         saveAs(blob, 'spreadsheet.csv');
//     };

//     return (
//         <StyledSpreadsheetDisplay>
//             <h2>Spreadsheet Display</h2>
//             <Spreadsheet data={data} />
//             <button className="download-button" onClick={handleDownload}>Download Spreadsheet</button>
//         </StyledSpreadsheetDisplay>
//     );
// };

// export default SpreadsheetDisplay;

// FeedbackList.js

import { useState, useEffect } from 'react';
import feedbackApi from '../../api/modules/feedback.api';

const FeedbackList = () => {
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { response, err } = await feedbackApi.fetchFeedback();
        console.log(response, err);
        if (err) {
          console.error('Error fetching feedback:', err);
        } else {
          console.log(response.data)
          setFeedbackList(response.data);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchFeedback();
  }, []);

  return (
    <div>
      <h2>Demands</h2>
      <ul>
        {feedbackList.map((feedback) => (
          <li key={feedback._id}>
            <strong>User:</strong> {feedback.user} - <strong>Feedback:</strong> {feedback.feedback}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedbackList;