// import React, { useState, useEffect } from 'react';
// import SpreadsheetDisplay from './SpreadsheetDisplay';
// import FeedbackForm from './FeedbackForm';
// import * as XLSX from 'xlsx';

// const FeedbackSpreadsheet = () => {
//     const [feedbackData, setFeedbackData] = useState([]);

//     useEffect(() => {
//         // Read data from the Excel file when the component mounts
//         fetchDataFromExcel();
//     }, []);

//     const fetchDataFromExcel = () => {
//         const url = '/feedback.xlsx';
//         fetch(url)
//             .then((res) => res.arrayBuffer())
//             .then((arrayBuffer) => {
//                 const data = new Uint8Array(arrayBuffer);
//                 const workbook = XLSX.read(data, { type: 'array' });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//                 setFeedbackData(jsonData);
//             })
//             .catch((error) => {
//                 console.error('Error reading Excel file:', error);
//             });
//     };

//     const handleFeedbackSubmit = (feedback) => {
//         const newData = [...feedbackData, [feedback]];
//         updateExcelFile(newData);
//     };

//     const updateExcelFile = (data) => {
//         const worksheet = XLSX.utils.aoa_to_sheet(data);
//         const newWorkbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Sheet1');
//         const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
//         const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//         // Update feedback.xlsx file in public folder
//         fetch('/feedback.xlsx', {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             },
//             body: blob
//         }).then(() => {
//             console.log('Feedback file updated successfully');
//             // Update local state after updating the file
//             setFeedbackData(data);
//         }).catch(error => console.error('Error updating feedback file:', error));
//     };

//     return (
//         <div>
//             <SpreadsheetDisplay data={feedbackData} />
//             <FeedbackForm onSubmit={handleFeedbackSubmit} />
//         </div>
//     );
// };

// export default FeedbackSpreadsheet;

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import FeedbackForm from '../components/common/FeedbackForm';
import feedbackApi from '../api/modules/feedback.api';
import FeedbackList from '../components/common/FeedbackList';

// Define animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 50px auto; /* Add margin for centering and to create space between the top and the feedback list */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.5s ease; /* Apply fadeIn animation */
`;

const FeedbackSpreadsheet = () => {
    const [feedbackData, setFeedbackData] = useState([]);

    useEffect(() => {
        fetchFeedbackData();
    }, []);

    const fetchFeedbackData = async () => {
        try {
            const { response, err } = await feedbackApi.fetchFeedback();
            if (err) {
                console.error('Error fetching feedback data:', err);
            } else {
                setFeedbackData(response.data);
            }
        } catch (error) {
            console.error('Error fetching feedback data:', error);
        }
    };

    const handleFeedbackSubmit = async (feedback) => {
        try {
            const { response, err } = await feedbackApi.submitFeedback(feedback);
            if (err) {
                console.error('Error submitting feedback:', err);
            } else {
                console.log('Feedback submitted successfully:', response);
                setFeedbackData(prevData => [...prevData, feedback]);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    return (
        <Container>
            <FeedbackList feedbackData={feedbackData} style={{ marginTop: '20px' }} /> {/* Add margin-top for spacing */}
            <FeedbackForm onSubmit={handleFeedbackSubmit} />
        </Container>
    );
};

export default FeedbackSpreadsheet;



// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { saveAs } from 'file-saver';
// import * as XLSX from 'xlsx';

// const FeedbackSpreadsheet = () => {
//   const [feedbackData, setFeedbackData] = useState([]);

//   useEffect(() => {
//     fetchFeedbackData();
//   }, []);

//   const fetchFeedbackData = async () => {
//     try {
//       const response = await axios.get('http://localhost:8000/api/v1/feedback/feedback-list');
//       setFeedbackData(response.data);
//     } catch (error) {
//       console.error('Error fetching feedback data:', error);
//     }
//   };

//   const handleDownload = () => {
//     const csvData = feedbackData.map(feedback => {
//       return `${feedback.user},${feedback.feedback},${feedback.createdAt}`;
//     }).join('\n');
//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.json_to_sheet(feedbackData);
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback Data');
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//     saveAs(blob, 'feedback_data.xlsx');
//   };

//   return (
//     <div>
//       <h2>Feedback Spreadsheet</h2>
//       <table>
//         <thead>
//           <tr>
//             <th>User</th>
//             <th>Feedback</th>
//             <th>Timestamp</th>
//           </tr>
//         </thead>
//         <tbody>
//           {feedbackData.map(feedback => (
//             <tr key={feedback._id}>
//               <td>{feedback.user}</td>
//               <td>{feedback.feedback}</td>
//               <td>{new Date(feedback.createdAt).toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <button onClick={handleDownload}>Download Feedback Data</button>
//     </div>
//   );
// };

// export default FeedbackSpreadsheet;
